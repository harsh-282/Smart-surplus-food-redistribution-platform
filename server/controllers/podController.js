const ProofOfDelivery = require('../models/ProofOfDelivery');
const Donation = require('../models/Donation');
const { createNotification } = require('../utils/notificationHelper');

// Helper to generate unique POD ID (e.g., POD-2026-834912)
const generatePodId = async () => {
  const year = new Date().getFullYear();
  let podId = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    const random = Math.floor(100000 + Math.random() * 900000);
    podId = `POD-${year}-${random}`;
    const found = await ProofOfDelivery.findOne({ podId });
    if (!found) exists = false;
    attempts++;
  }
  return podId;
};

// @desc    Create Digital Proof of Delivery
// @route   POST /api/pod/:donationId
// @access  Volunteer
const createPOD = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { receiverName, notes, lat, lng, address } = req.body;

    if (req.user.role === 'volunteer' && req.user.verificationStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Your volunteer account is not verified or is suspended. Unverified volunteers cannot submit Digital Proof of Delivery.',
      });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Authorization: Volunteer must be assigned to this donation
    if (donation.volunteerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to create proof of delivery for this donation.' });
    }

    // Workflow validation: Must be in Picked Up or Delivered state
    if (!['Picked Up', 'Delivered'].includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot create Proof of Delivery for donation with status "${donation.status}". Delivery must be in progress or delivered.`,
      });
    }

    // Check duplicate POD
    let existingPOD = await ProofOfDelivery.findOne({ donationId })
      .populate('volunteerId', 'name email phone')
      .populate('ngoId', 'name email phone')
      .populate('donorId', 'name email phone');

    if (existingPOD) {
      return res.status(200).json({
        success: true,
        message: 'Proof of Delivery has already been submitted for this donation.',
        proofOfDelivery: existingPOD,
      });
    }

    // Generate Unique POD ID
    const podId = await generatePodId();

    // Delivery Photo handle
    let deliveryPhoto = { url: '', publicId: '' };
    if (req.file) {
      deliveryPhoto = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    // Create Proof of Delivery Record
    const pod = await ProofOfDelivery.create({
      podId,
      donationId: donation._id,
      volunteerId: req.user._id,
      ngoId: donation.acceptedBy,
      donorId: donation.donorId,
      deliveredAt: new Date(),
      receiverName: receiverName || 'NGO Representative',
      deliveryPhoto,
      notes: notes || 'Surplus food delivered successfully.',
      deliveryLocation: {
        lat: lat ? parseFloat(lat) : donation.pickupCoordinates?.lat,
        lng: lng ? parseFloat(lng) : donation.pickupCoordinates?.lng,
        address: address || donation.pickupAddress || '',
      },
      volunteerConfirmed: true,
      ngoConfirmed: false,
      status: 'Submitted',
    });

    // Update Donation Status to 'Delivered' if it was 'Picked Up'
    if (donation.status === 'Picked Up') {
      donation.status = 'Delivered';
    }

    // Append to status history
    const isDuplicate = donation.statusHistory.some(
      (h) => h.status === 'Delivered' && h.message.includes(podId)
    );

    if (!isDuplicate) {
      donation.statusHistory.push({
        status: 'Delivered',
        timestamp: new Date(),
        message: `✓ Digital Proof of Delivery submitted (${podId}). Awaiting NGO receipt confirmation.`,
        updatedBy: req.user._id,
        role: 'volunteer',
      });
    }

    await donation.save();

    // Populate created POD
    const populatedPOD = await ProofOfDelivery.findById(pod._id)
      .populate('volunteerId', 'name email phone')
      .populate('ngoId', 'name email phone')
      .populate('donorId', 'name email phone');

    // Notify NGO
    if (donation.acceptedBy) {
      await createNotification({
        recipient: donation.acceptedBy,
        sender: req.user._id,
        title: 'Proof of Delivery Submitted 📦',
        message: `Volunteer ${req.user.name} submitted digital Proof of Delivery (${podId}) for "${donation.foodName}". Please confirm receipt.`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, podId, status: 'Delivered' },
      });
    }

    // Notify Donor
    if (donation.donorId) {
      await createNotification({
        recipient: donation.donorId,
        sender: req.user._id,
        title: 'Donation Delivered with POD 🚚',
        message: `Your donation "${donation.foodName}" has been delivered by the volunteer (POD ID: ${podId}).`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, podId, status: 'Delivered' },
      });
    }

    res.status(201).json({
      success: true,
      message: '🎉 Digital Proof of Delivery created successfully!',
      proofOfDelivery: populatedPOD,
    });
  } catch (error) {
    console.error('Error creating POD:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create Proof of Delivery.' });
  }
};

// @desc    Get Proof of Delivery by donation ID
// @route   GET /api/pod/:donationId
// @access  Private (Donor, NGO, Volunteer, Admin)
const getPOD = async (req, res) => {
  try {
    const { donationId } = req.params;

    const pod = await ProofOfDelivery.findOne({ donationId })
      .populate('volunteerId', 'name email phone')
      .populate('ngoId', 'name email phone')
      .populate('donorId', 'name email phone')
      .populate('ngoConfirmedBy', 'name email');

    if (!pod) {
      return res.status(404).json({ success: false, message: 'Proof of delivery not found for this donation.' });
    }

    // Authorization check
    const userIdStr = req.user._id.toString();
    const isAuthorized =
      req.user.role === 'admin' ||
      pod.volunteerId?._id?.toString() === userIdStr ||
      pod.ngoId?._id?.toString() === userIdStr ||
      pod.donorId?._id?.toString() === userIdStr;

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this Proof of Delivery.' });
    }

    res.status(200).json({ success: true, proofOfDelivery: pod });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    NGO confirms receipt of delivery
// @route   PUT /api/pod/:donationId/confirm
// @access  NGO
const confirmPOD = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Check authorization: Must be the accepted NGO
    if (donation.acceptedBy?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the receiving NGO can confirm delivery receipt.' });
    }

    let pod = await ProofOfDelivery.findOne({ donationId });
    if (!pod) {
      return res.status(404).json({ success: false, message: 'No Proof of Delivery record found to confirm.' });
    }

    if (pod.ngoConfirmed) {
      return res.status(200).json({
        success: true,
        message: 'Delivery receipt has already been confirmed.',
        proofOfDelivery: pod,
      });
    }

    // Confirm POD
    pod.ngoConfirmed = true;
    pod.ngoConfirmedAt = new Date();
    pod.ngoConfirmedBy = req.user._id;
    pod.status = 'Confirmed';
    await pod.save();

    // Mark donation status as Completed
    donation.status = 'Completed';
    donation.statusHistory.push({
      status: 'Completed',
      timestamp: new Date(),
      message: `✓ Delivery Confirmed by NGO (${req.user.name || 'NGO'}). Receipt verified and redistribution completed.`,
      updatedBy: req.user._id,
      role: 'ngo',
    });
    await donation.save();

    const populatedPOD = await ProofOfDelivery.findById(pod._id)
      .populate('volunteerId', 'name email phone')
      .populate('ngoId', 'name email phone')
      .populate('donorId', 'name email phone')
      .populate('ngoConfirmedBy', 'name email');

    // Notify Volunteer
    if (donation.volunteerId) {
      await createNotification({
        recipient: donation.volunteerId,
        sender: req.user._id,
        title: 'Delivery Receipt Confirmed ✅',
        message: `NGO ${req.user.name || ''} confirmed receipt for donation "${donation.foodName}". Great work!`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, status: 'Completed' },
      });
    }

    // Notify Donor
    if (donation.donorId) {
      await createNotification({
        recipient: donation.donorId,
        sender: req.user._id,
        title: 'Redistribution Completed 🎉',
        message: `NGO confirmed receipt of your donation "${donation.foodName}". Food redistribution completed successfully!`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, status: 'Completed' },
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Delivery receipt confirmed successfully! Donation marked as Completed.',
      proofOfDelivery: populatedPOD,
      donation,
    });
  } catch (error) {
    console.error('Error confirming POD:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to confirm delivery receipt.' });
  }
};

module.exports = {
  createPOD,
  getPOD,
  confirmPOD,
};
