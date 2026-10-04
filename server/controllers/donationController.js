const Donation = require('../models/Donation');
const User = require('../models/User');
const NGO = require('../models/NGO');
const cloudinary = require('../config/cloudinary');
const { isExpired } = require('../utils/expiryHelper');
const { createNotification, notifyMultipleUsers } = require('../utils/notificationHelper');
const { generateUniqueQrDonationId, ensureQrDonationId } = require('../utils/qrHelper');

// Helper to push status history entries cleanly (preventing duplicate consecutive entries)
const addStatusHistory = (donation, status, message, user = null) => {
  if (!donation.statusHistory) {
    donation.statusHistory = [];
  }
  const lastEntry = donation.statusHistory[donation.statusHistory.length - 1];
  if (lastEntry && lastEntry.status === status) {
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

// @desc    Create a donation
// @route   POST /api/donations
// @access  Donor
const createDonation = async (req, res) => {
  try {
    const { foodName, category, quantity, preparationDate, expiryDate, pickupAddress, description } = req.body;

    if (!foodName || !category || !quantity || !preparationDate || !expiryDate || !pickupAddress) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const prepDate = new Date(preparationDate);
    const expDate = new Date(expiryDate);
    const now = new Date();

    if (isNaN(prepDate.getTime()) || isNaN(expDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid preparation or expiry date.' });
    }

    if (expDate <= now) {
      return res.status(400).json({ success: false, message: 'Expiry date must be in the future.' });
    }

    if (expDate <= prepDate) {
      return res.status(400).json({ success: false, message: 'Expiry date must be after preparation date.' });
    }

    let imageData = { url: '', publicId: '' };

    // If file uploaded via Cloudinary (multer-storage-cloudinary)
    if (req.file) {
      imageData = {
        url: req.file.path,       // Cloudinary secure URL
        publicId: req.file.filename, // Cloudinary public_id
      };
    }

    const qrDonationId = await generateUniqueQrDonationId();

    let pickupCoords = null;
    if (req.body.pickupCoordinates) {
      try {
        pickupCoords = typeof req.body.pickupCoordinates === 'string' ? JSON.parse(req.body.pickupCoordinates) : req.body.pickupCoordinates;
      } catch (e) {}
    }
    if ((!pickupCoords || pickupCoords.lat == null) && req.user.locationCoordinates?.lat != null) {
      pickupCoords = req.user.locationCoordinates;
    }

    const donation = new Donation({
      donorId: req.user._id,
      foodName,
      category,
      quantity,
      image: imageData,
      preparationDate: prepDate,
      expiryDate: expDate,
      pickupAddress,
      pickupCoordinates: pickupCoords,
      description,
      status: 'Available',
      qrDonationId,
      qrCreatedAt: new Date(),
    });

    addStatusHistory(
      donation,
      'Available',
      'Donor created a new surplus food donation. Listed as available for NGO redistribution.',
      req.user
    );

    await donation.save();

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address')
      .populate('statusHistory.updatedBy', 'name role email');

    // 1. Notify the donor of successful creation
    await createNotification({
      recipient: req.user._id,
      title: 'Donation Listed Successfully 🌿',
      message: `Your food donation "${foodName}" (${quantity}) is now live. NGOs in your area have been notified.`,
      type: 'DONATION_CREATED',
      donationId: donation._id,
      metadata: { foodName, quantity, status: 'Available' },
    });

    // 2. Notify all active NGOs about new available surplus food
    const ngos = await User.find({ role: 'ngo', isActive: true }).select('_id');
    if (ngos.length > 0) {
      await notifyMultipleUsers(
        ngos.map((n) => n._id),
        {
          sender: req.user._id,
          title: 'New Surplus Food Available 🌿',
          message: `New donation: "${foodName}" (${quantity}) is available for pickup at ${pickupAddress}.`,
          type: 'DONATION_CREATED',
          donationId: donation._id,
          metadata: { foodName, category, quantity, pickupAddress },
        }
      );
    }

    res.status(201).json({ success: true, message: 'Donation posted successfully!', donation: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all available donations (for NGO view with advanced filters)
// @route   GET /api/donations
// @access  Private
const getDonations = async (req, res) => {
  try {
    const { status, category, search, location, quantity, expiryStatus, urgentOnly } = req.query;
    let filter = {};
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (status && status !== 'All') filter.status = status;
    if (category && category !== 'All') filter.category = category;

    if (search) {
      filter.$or = [
        { foodName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { pickupAddress: { $regex: search, $options: 'i' } },
        { quantity: { $regex: search, $options: 'i' } },
      ];
    }

    if (location) {
      filter.pickupAddress = { $regex: location, $options: 'i' };
    }

    if (quantity) {
      filter.quantity = { $regex: quantity, $options: 'i' };
    }

    // Expiry Status Filter
    if (expiryStatus === 'Fresh') {
      filter.expiryDate = { $gt: next24h };
    } else if (expiryStatus === 'Near Expiry' || expiryStatus === 'Urgent' || urgentOnly === 'true') {
      filter.expiryDate = { $gt: now, $lte: next24h };
    } else if (expiryStatus === 'Expired') {
      filter.expiryDate = { $lte: now };
    }

    // Role specific rules
    if (req.user.role === 'donor') {
      filter.donorId = req.user._id;
    }

    if (req.user.role === 'ngo') {
      if (!status || status === 'All') {
        filter.status = 'Available';
      }
    }

    // CRITICAL SECURITY & BUSINESS RULE:
    // Hide expired food from NGO available donation listings and any available queries
    if (filter.status === 'Available' || (req.user.role === 'ngo' && (!status || status === 'All'))) {
      if (filter.expiryDate) {
        if (filter.expiryDate.$gt) {
          filter.expiryDate.$gt = new Date(Math.max(new Date(filter.expiryDate.$gt).getTime(), now.getTime()));
        }
      } else {
        filter.expiryDate = { $gt: now };
      }
    }

    if (req.user.role === 'volunteer') {
      filter.volunteerId = req.user._id;
    }

    const donations = await Donation.find(filter)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone')
      .sort({ expiryDate: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Private
const getDonation = async (req, res) => {
  try {
    let donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email phone address locationCoordinates')
      .populate('acceptedBy', 'name email phone address locationCoordinates')
      .populate('volunteerId', 'name email phone')
      .populate('statusHistory.updatedBy', 'name role email');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    donation = await ensureQrDonationId(donation);

    const donationObj = donation.toObject();
    if (donation.acceptedBy) {
      const ngoProfile = await NGO.findOne({ userId: donation.acceptedBy._id }).select('address locationCoordinates organizationName');
      if (ngoProfile) {
        if (!donationObj.acceptedBy.address) donationObj.acceptedBy.address = ngoProfile.address;
        if (!donationObj.acceptedBy.locationCoordinates && ngoProfile.locationCoordinates) {
          donationObj.acceptedBy.locationCoordinates = ngoProfile.locationCoordinates;
        }
      }
    }

    // Dynamic fallback for legacy records created prior to statusHistory schema additions
    if (!donationObj.statusHistory || donationObj.statusHistory.length === 0) {
      donationObj.statusHistory = [
        {
          status: 'Available',
          timestamp: donationObj.createdAt,
          message: 'Donor created a new surplus food donation.',
          role: 'donor',
          updatedBy: donationObj.donorId,
        }
      ];

      if (['Accepted', 'Pickup Assigned', 'Picked Up', 'Delivered', 'Completed'].includes(donationObj.status) && donationObj.acceptedBy) {
        donationObj.statusHistory.push({
          status: 'Accepted',
          timestamp: donationObj.updatedAt,
          message: 'Food donation claimed by NGO for redistribution.',
          role: 'ngo',
          updatedBy: donationObj.acceptedBy,
        });
      }

      if (['Pickup Assigned', 'Picked Up', 'Delivered', 'Completed'].includes(donationObj.status) && donationObj.volunteerId) {
        donationObj.statusHistory.push({
          status: 'Pickup Assigned',
          timestamp: donationObj.updatedAt,
          message: 'Delivery volunteer assigned for pickup.',
          role: 'ngo',
          updatedBy: donationObj.volunteerId,
        });
      }

      if (['Picked Up', 'Delivered', 'Completed'].includes(donationObj.status)) {
        donationObj.statusHistory.push({
          status: 'Picked Up',
          timestamp: donationObj.updatedAt,
          message: 'Food collected from donor pickup location.',
          role: 'volunteer',
          updatedBy: donationObj.volunteerId,
        });
      }

      if (['Delivered', 'Completed'].includes(donationObj.status)) {
        donationObj.statusHistory.push({
          status: 'Delivered',
          timestamp: donationObj.updatedAt,
          message: 'Surplus food delivered to NGO center.',
          role: 'volunteer',
          updatedBy: donationObj.volunteerId,
        });
      }

      if (donationObj.status === 'Completed') {
        donationObj.statusHistory.push({
          status: 'Completed',
          timestamp: donationObj.updatedAt,
          message: 'Donation workflow and redistribution completed.',
          role: 'ngo',
        });
      }

      if (donationObj.status === 'Cancelled') {
        donationObj.statusHistory.push({
          status: 'Cancelled',
          timestamp: donationObj.updatedAt,
          message: 'Donation was cancelled.',
        });
      }
    }

    res.status(200).json({ success: true, donation: donationObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get donation by QR Donation ID (with role authorization)
// @route   GET /api/donations/qr/:qrDonationId
// @access  Private (Role Authorized)
const getDonationByQr = async (req, res) => {
  try {
    const { qrDonationId } = req.params;

    let donation = await Donation.findOne({ qrDonationId })
      .populate('donorId', 'name email phone address locationCoordinates')
      .populate('acceptedBy', 'name email phone address locationCoordinates')
      .populate('volunteerId', 'name email phone')
      .populate('statusHistory.updatedBy', 'name role email');

    if (!donation) {
      // Fallback: If passed ID is a valid ObjectId, search by _id
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(qrDonationId);
      if (isObjectId) {
        donation = await Donation.findById(qrDonationId)
          .populate('donorId', 'name email phone address locationCoordinates')
          .populate('acceptedBy', 'name email phone address locationCoordinates')
          .populate('volunteerId', 'name email phone')
          .populate('statusHistory.updatedBy', 'name role email');
      }
    }

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'No matching surplus food donation found for the scanned QR code.',
      });
    }

    donation = await ensureQrDonationId(donation);

    // Role-based Authorization check
    const userIdStr = req.user._id.toString();
    const role = req.user.role;
    let isAuthorized = false;

    if (role === 'admin') {
      isAuthorized = true;
    } else if (role === 'donor') {
      isAuthorized = donation.donorId?._id?.toString() === userIdStr;
    } else if (role === 'ngo') {
      // NGO can view available donations OR donations they claimed
      isAuthorized = donation.status === 'Available' || donation.acceptedBy?._id?.toString() === userIdStr;
    } else if (role === 'volunteer') {
      // Volunteer can view assigned donations
      isAuthorized = donation.volunteerId?._id?.toString() === userIdStr;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to access this donation record.',
      });
    }

    res.status(200).json({ success: true, donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    NGO accepts a donation
// @route   PUT /api/donations/:id/accept
// @access  NGO
const acceptDonation = async (req, res) => {
  try {
    if (req.user.verificationStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Your NGO account is pending verification or is not approved. You can claim donations after admin approval.',
      });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (donation.status !== 'Available') {
      return res.status(400).json({ success: false, message: `Donation is already ${donation.status}.` });
    }

    // Check if donation has expired before allowing acceptance
    if (isExpired(donation.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, this food donation has expired and can no longer be accepted.',
      });
    }

    donation.status = 'Accepted';
    donation.acceptedBy = req.user._id;

    addStatusHistory(
      donation,
      'Accepted',
      `${req.user.name || 'NGO'} claimed this food donation for community redistribution.`,
      req.user
    );

    await donation.save();

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('statusHistory.updatedBy', 'name role email');

    // Notify the donor that their donation was accepted
    await createNotification({
      recipient: donation.donorId,
      sender: req.user._id,
      title: 'Donation Accepted 🎉',
      message: `${req.user.name || 'An NGO'} has accepted your donation "${donation.foodName}". Volunteer pickup will be assigned soon.`,
      type: 'DONATION_ACCEPTED',
      donationId: donation._id,
      metadata: { foodName: donation.foodName, ngoName: req.user.name },
    });

    res.status(200).json({ success: true, message: 'Donation accepted successfully!', donation: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign volunteer to a donation
// @route   PUT /api/donations/:id/assign-volunteer
// @access  NGO, Admin
const assignVolunteer = async (req, res) => {
  try {
    if (req.user.role === 'ngo' && req.user.verificationStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Your NGO account is pending verification. Only verified NGOs can assign volunteers.',
      });
    }

    const { volunteerId } = req.body;
    const volunteerUser = await User.findById(volunteerId);
    if (!volunteerUser || volunteerUser.role !== 'volunteer') {
      return res.status(400).json({ success: false, message: 'Invalid volunteer specified.' });
    }
    if (volunteerUser.verificationStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Selected volunteer account is not verified or is suspended. Only verified volunteers can receive delivery assignments.',
      });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (!['Accepted'].includes(donation.status)) {
      return res.status(400).json({ success: false, message: 'Can only assign volunteer to an accepted donation.' });
    }

    donation.volunteerId = volunteerId;
    donation.status = 'Pickup Assigned';

    addStatusHistory(
      donation,
      'Pickup Assigned',
      'Delivery volunteer assigned for pickup and transport.',
      req.user
    );

    await donation.save();

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone')
      .populate('statusHistory.updatedBy', 'name role email');

    // 1. Notify the assigned volunteer
    await createNotification({
      recipient: volunteerId,
      sender: req.user._id,
      title: 'New Pickup Assigned 🚴',
      message: `You have been assigned to pick up "${donation.foodName}" (${donation.quantity}) at ${donation.pickupAddress}.`,
      type: 'VOLUNTEER_ASSIGNED',
      donationId: donation._id,
      metadata: { foodName: donation.foodName, pickupAddress: donation.pickupAddress },
    });

    // 2. Notify the donor
    await createNotification({
      recipient: donation.donorId,
      sender: req.user._id,
      title: 'Volunteer Assigned for Pickup 🚴',
      message: `A volunteer has been assigned to collect your donation "${donation.foodName}".`,
      type: 'STATUS_CHANGED',
      donationId: donation._id,
      metadata: { foodName: donation.foodName, status: 'Pickup Assigned' },
    });

    res.status(200).json({ success: true, message: 'Volunteer assigned successfully!', donation: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update donation status (Volunteer updates pickup/delivery)
// @route   PUT /api/donations/:id/status
// @access  Volunteer, Admin
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pickup Assigned', 'Picked Up', 'Delivered', 'Completed'];
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    // Volunteer can only update their own assigned donations
    if (req.user.role === 'volunteer' && donation.volunteerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this donation.' });
    }

    donation.status = status;

    const statusMessages = {
      'Picked Up': 'Volunteer collected food from the donor pickup location.',
      'Delivered': 'Surplus food delivered to NGO center.',
      'Completed': 'Donation redistribution workflow completed successfully.',
    };

    addStatusHistory(
      donation,
      status,
      statusMessages[status] || `Status updated to ${status}.`,
      req.user
    );

    await donation.save();

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone')
      .populate('statusHistory.updatedBy', 'name role email');

    // Notify relevant users based on new status
    const statusNotifications = {
      'Picked Up': {
        donorTitle: 'Donation Picked Up 📦',
        donorMsg: `Your donation "${donation.foodName}" has been collected by the volunteer from ${donation.pickupAddress}.`,
        ngoTitle: 'Donation In Transit 🚚',
        ngoMsg: `Donation "${donation.foodName}" has been picked up and is on its way to your location.`,
      },
      'Delivered': {
        donorTitle: 'Donation Delivered 🥗',
        donorMsg: `Your donation "${donation.foodName}" has been successfully delivered to the NGO.`,
        ngoTitle: 'Donation Delivered 🥗',
        ngoMsg: `Donation "${donation.foodName}" has arrived at your distribution center.`,
      },
      'Completed': {
        donorTitle: 'Donation Completed ✅',
        donorMsg: `Thank you! Your donation "${donation.foodName}" has been distributed. You helped reduce hunger!`,
        ngoTitle: 'Donation Marked Completed ✅',
        ngoMsg: `Donation "${donation.foodName}" distribution has been finalized.`,
      },
    };

    const notifInfo = statusNotifications[status];
    if (notifInfo) {
      // Notify Donor
      if (donation.donorId) {
        await createNotification({
          recipient: donation.donorId,
          sender: req.user._id,
          title: notifInfo.donorTitle,
          message: notifInfo.donorMsg,
          type: 'STATUS_CHANGED',
          donationId: donation._id,
          metadata: { foodName: donation.foodName, status },
        });
      }

      // Notify NGO (if not the actor updating)
      if (donation.acceptedBy && donation.acceptedBy.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: donation.acceptedBy,
          sender: req.user._id,
          title: notifInfo.ngoTitle,
          message: notifInfo.ngoMsg,
          type: 'STATUS_CHANGED',
          donationId: donation._id,
          metadata: { foodName: donation.foodName, status },
        });
      }
    }

    res.status(200).json({ success: true, message: `Status updated to ${status}!`, donation: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a donation
// @route   PUT /api/donations/:id/cancel
// @access  Donor (own), Admin
const cancelDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Donors can only cancel their own donations
    if (req.user.role === 'donor' && donation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (['Picked Up', 'Delivered', 'Completed'].includes(donation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel donation that is already picked up or completed.' });
    }

    donation.status = 'Cancelled';
    addStatusHistory(
      donation,
      'Cancelled',
      `Donation was cancelled by ${req.user.role === 'admin' ? 'administrator' : 'donor'}.`,
      req.user
    );

    await donation.save();

    // Notify NGO if accepted
    if (donation.acceptedBy && donation.acceptedBy.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: donation.acceptedBy,
        sender: req.user._id,
        title: 'Donation Cancelled ⚠️',
        message: `Donation "${donation.foodName}" was cancelled.`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, status: 'Cancelled' },
      });
    }

    // Notify Volunteer if assigned
    if (donation.volunteerId && donation.volunteerId.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: donation.volunteerId,
        sender: req.user._id,
        title: 'Delivery Assignment Cancelled ⚠️',
        message: `Pickup assignment for donation "${donation.foodName}" has been cancelled.`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, status: 'Cancelled' },
      });
    }

    // Notify Donor if cancelled by admin
    if (req.user.role === 'admin' && donation.donorId.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: donation.donorId,
        sender: req.user._id,
        title: 'Donation Cancelled by Admin ⚠️',
        message: `Your donation "${donation.foodName}" was cancelled by the administrator.`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, status: 'Cancelled' },
      });
    }

    res.status(200).json({ success: true, message: 'Donation cancelled.', donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get donor's own donations
// @route   GET /api/donations/my
// @access  Donor
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id })
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDonation,
  getDonations,
  getDonation,
  getDonationByQr,
  acceptDonation,
  assignVolunteer,
  updateStatus,
  cancelDonation,
  getMyDonations,
};
