const crypto = require('crypto');
const Donation = require('../models/Donation');
const { createNotification } = require('../utils/notificationHelper');

const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

const generate6DigitOtp = () => {
  return String(crypto.randomInt(100000, 1000000));
};

// Helper to push status history entries cleanly
const addStatusHistory = (donation, status, message, user = null) => {
  if (!donation.statusHistory) {
    donation.statusHistory = [];
  }
  const lastEntry = donation.statusHistory[donation.statusHistory.length - 1];
  if (lastEntry && lastEntry.status === status && lastEntry.message === message) {
    return;
  }
  donation.statusHistory.push({
    status,
    timestamp: new Date(),
    message: message || `Status updated to ${status}.`,
    updatedBy: user?._id || (typeof user === 'string' ? user : null),
    role: user?.role || '',
  });
};

// @desc    Generate Pickup OTP (Donor only)
// @route   POST /api/otp/:donationId/pickup/generate
// @access  Donor
const generatePickupOtp = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Authorization: User must be the donor who created the donation or admin
    if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the donor can generate the Pickup OTP.' });
    }

    // Status check
    if (!['Accepted', 'Pickup Assigned'].includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Pickup OTP can only be generated for accepted donations awaiting pickup (Current status: ${donation.status}).`,
      });
    }

    if (donation.pickupOtpUsed) {
      return res.status(400).json({ success: false, message: 'Pickup handover has already been verified for this donation.' });
    }

    // Cooldown check (30 seconds)
    if (donation.pickupOtpExpiresAt) {
      const createdAgo = Date.now() - (donation.pickupOtpExpiresAt.getTime() - 5 * 60 * 1000);
      if (createdAgo < 30 * 1000) {
        const remainingCd = Math.ceil((30 * 1000 - createdAgo) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingCd} seconds before regenerating a new Pickup OTP.`,
        });
      }
    }

    const rawOtp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    donation.pickupOtpHash = hashOtp(rawOtp);
    donation.pickupOtpExpiresAt = expiresAt;
    donation.pickupOtpAttempts = 0;
    donation.pickupOtpUsed = false;

    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Pickup OTP generated successfully!',
      otp: rawOtp,
      expiresAt,
    });
  } catch (error) {
    console.error('Error generating pickup OTP:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate Pickup OTP.' });
  }
};

// @desc    Verify Pickup OTP (Volunteer / Admin)
// @route   POST /api/otp/:donationId/pickup/verify
// @access  Volunteer, Admin
const verifyPickupOtp = async (req, res) => {
  try {
    if (req.user.role === 'volunteer' && req.user.verificationStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Your volunteer account is not verified or is suspended. Unverified volunteers cannot perform OTP verification.',
      });
    }

    const { donationId } = req.params;
    const { otp } = req.body;

    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit numeric OTP.' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Volunteer authorization check
    if (donation.volunteerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to verify pickup for this donation.' });
    }

    if (donation.pickupOtpUsed) {
      return res.status(200).json({
        success: true,
        message: 'Pickup OTP has already been verified.',
        donation,
      });
    }

    if (!donation.pickupOtpHash || !donation.pickupOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Pickup OTP has not been generated yet. Please ask the donor to generate a Pickup OTP on their dashboard.',
      });
    }

    if (new Date() > new Date(donation.pickupOtpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Pickup OTP has expired. Please ask the donor to generate a new OTP.',
      });
    }

    if (donation.pickupOtpAttempts >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum failed attempts reached (5/5). Pickup OTP invalidated. Please ask the donor to generate a new OTP.',
      });
    }

    const submittedHash = hashOtp(String(otp).trim());
    if (submittedHash !== donation.pickupOtpHash) {
      donation.pickupOtpAttempts += 1;
      await donation.save();

      const remainingAttempts = 5 - donation.pickupOtpAttempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect Pickup OTP. ${remainingAttempts} attempt(s) remaining before OTP invalidation.`,
        remainingAttempts,
      });
    }

    // Successful Verification
    donation.pickupOtpUsed = true;
    donation.pickupOtpVerifiedAt = new Date();
    donation.status = 'Picked Up';

    addStatusHistory(
      donation,
      'Picked Up',
      '✓ Pickup OTP Verified. Food handover confirmed by donor.',
      req.user
    );

    await donation.save();

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone')
      .populate('statusHistory.updatedBy', 'name role email');

    // Notify Donor
    await createNotification({
      recipient: donation.donorId,
      sender: req.user._id,
      title: 'Pickup Verified & Confirmed 📦',
      message: `Pickup OTP verified for "${donation.foodName}". Volunteer ${req.user.name} has collected the food.`,
      type: 'STATUS_CHANGED',
      donationId: donation._id,
      metadata: { foodName: donation.foodName, status: 'Picked Up' },
    });

    // Notify NGO
    if (donation.acceptedBy) {
      await createNotification({
        recipient: donation.acceptedBy,
        sender: req.user._id,
        title: 'Food Picked Up & In Transit 🚚',
        message: `Donation "${donation.foodName}" pickup verified. Food is in transit to your distribution center.`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, status: 'Picked Up' },
      });
    }

    res.status(200).json({
      success: true,
      message: '🎉 Pickup OTP verified successfully! Food marked as Picked Up.',
      donation: populated,
    });
  } catch (error) {
    console.error('Error verifying pickup OTP:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify Pickup OTP.' });
  }
};

// @desc    Generate Delivery OTP (NGO only)
// @route   POST /api/otp/:donationId/delivery/generate
// @access  NGO
const generateDeliveryOtp = async (req, res) => {
  try {
    if (req.user.role === 'ngo' && req.user.verificationStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Your NGO account is pending verification or is suspended. Unverified NGOs cannot generate delivery OTPs.',
      });
    }

    const { donationId } = req.params;
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Authorization: User must be receiving NGO or admin
    if (donation.acceptedBy?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the receiving NGO can generate the Delivery OTP.' });
    }

    // Status check
    if (!['Picked Up', 'Delivered'].includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Delivery OTP can only be generated after food is picked up (Current status: ${donation.status}).`,
      });
    }

    if (donation.deliveryOtpUsed) {
      return res.status(400).json({ success: false, message: 'Delivery handover has already been verified for this donation.' });
    }

    // Cooldown check (30 seconds)
    if (donation.deliveryOtpExpiresAt) {
      const createdAgo = Date.now() - (donation.deliveryOtpExpiresAt.getTime() - 5 * 60 * 1000);
      if (createdAgo < 30 * 1000) {
        const remainingCd = Math.ceil((30 * 1000 - createdAgo) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingCd} seconds before regenerating a new Delivery OTP.`,
        });
      }
    }

    const rawOtp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    donation.deliveryOtpHash = hashOtp(rawOtp);
    donation.deliveryOtpExpiresAt = expiresAt;
    donation.deliveryOtpAttempts = 0;
    donation.deliveryOtpUsed = false;

    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Delivery OTP generated successfully!',
      otp: rawOtp,
      expiresAt,
    });
  } catch (error) {
    console.error('Error generating delivery OTP:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate Delivery OTP.' });
  }
};

// @desc    Verify Delivery OTP (Volunteer / Admin)
// @route   POST /api/otp/:donationId/delivery/verify
// @access  Volunteer, Admin
const verifyDeliveryOtp = async (req, res) => {
  try {
    if (req.user.role === 'volunteer' && req.user.verificationStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Your volunteer account is not verified or is suspended. Unverified volunteers cannot perform OTP verification.',
      });
    }

    const { donationId } = req.params;
    const { otp } = req.body;

    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit numeric OTP.' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Volunteer authorization check
    if (donation.volunteerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to verify delivery for this donation.' });
    }

    if (donation.deliveryOtpUsed) {
      return res.status(200).json({
        success: true,
        message: 'Delivery OTP has already been verified.',
        donation,
      });
    }

    if (!donation.deliveryOtpHash || !donation.deliveryOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Delivery OTP has not been generated yet. Please ask the NGO to generate a Delivery OTP on their dashboard.',
      });
    }

    if (new Date() > new Date(donation.deliveryOtpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery OTP has expired. Please ask the NGO to generate a new OTP.',
      });
    }

    if (donation.deliveryOtpAttempts >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum failed attempts reached (5/5). Delivery OTP invalidated. Please ask the NGO to generate a new OTP.',
      });
    }

    const submittedHash = hashOtp(String(otp).trim());
    if (submittedHash !== donation.deliveryOtpHash) {
      donation.deliveryOtpAttempts += 1;
      await donation.save();

      const remainingAttempts = 5 - donation.deliveryOtpAttempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect Delivery OTP. ${remainingAttempts} attempt(s) remaining before OTP invalidation.`,
        remainingAttempts,
      });
    }

    // Successful Verification
    donation.deliveryOtpUsed = true;
    donation.deliveryOtpVerifiedAt = new Date();
    donation.status = 'Delivered';

    addStatusHistory(
      donation,
      'Delivered',
      '✓ Delivery OTP Verified. Food handover confirmed by NGO.',
      req.user
    );

    await donation.save();

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone')
      .populate('statusHistory.updatedBy', 'name role email');

    // Notify NGO
    await createNotification({
      recipient: donation.acceptedBy,
      sender: req.user._id,
      title: 'Delivery OTP Verified 🚚',
      message: `Delivery OTP verified for "${donation.foodName}". Food is safely delivered to your center. Please complete Digital Proof of Delivery.`,
      type: 'STATUS_CHANGED',
      donationId: donation._id,
      metadata: { foodName: donation.foodName, status: 'Delivered' },
    });

    // Notify Donor
    await createNotification({
      recipient: donation.donorId,
      sender: req.user._id,
      title: 'Donation Delivered & Verified 🥗',
      message: `Your surplus food donation "${donation.foodName}" has been successfully delivered to the NGO.`,
      type: 'STATUS_CHANGED',
      donationId: donation._id,
      metadata: { foodName: donation.foodName, status: 'Delivered' },
    });

    res.status(200).json({
      success: true,
      message: '🎉 Delivery OTP verified successfully! Food marked as Delivered.',
      donation: populated,
    });
  } catch (error) {
    console.error('Error verifying delivery OTP:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify Delivery OTP.' });
  }
};

// @desc    Get OTP Verification Status for a Donation
// @route   GET /api/otp/:donationId/status
// @access  Private
const getOtpStatus = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    res.status(200).json({
      success: true,
      pickupOtpStatus: {
        used: Boolean(donation.pickupOtpUsed),
        verifiedAt: donation.pickupOtpVerifiedAt,
        hasActiveOtp: Boolean(donation.pickupOtpExpiresAt && new Date() < new Date(donation.pickupOtpExpiresAt) && !donation.pickupOtpUsed),
        expiresAt: donation.pickupOtpExpiresAt,
        attempts: donation.pickupOtpAttempts,
      },
      deliveryOtpStatus: {
        used: Boolean(donation.deliveryOtpUsed),
        verifiedAt: donation.deliveryOtpVerifiedAt,
        hasActiveOtp: Boolean(donation.deliveryOtpExpiresAt && new Date() < new Date(donation.deliveryOtpExpiresAt) && !donation.deliveryOtpUsed),
        expiresAt: donation.deliveryOtpExpiresAt,
        attempts: donation.deliveryOtpAttempts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generatePickupOtp,
  verifyPickupOtp,
  generateDeliveryOtp,
  verifyDeliveryOtp,
  getOtpStatus,
};
