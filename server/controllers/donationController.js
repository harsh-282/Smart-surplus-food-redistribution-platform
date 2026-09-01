const Donation = require('../models/Donation');
const cloudinary = require('../config/cloudinary');

// @desc    Create a donation
// @route   POST /api/donations
// @access  Donor
const createDonation = async (req, res) => {
  try {
    const { foodName, category, quantity, preparationDate, expiryDate, pickupAddress, description } = req.body;

    let imageData = { url: '', publicId: '' };

    // If file uploaded via Cloudinary (multer-storage-cloudinary)
    if (req.file) {
      imageData = {
        url: req.file.path,       // Cloudinary secure URL
        publicId: req.file.filename, // Cloudinary public_id
      };
    }

    const donation = await Donation.create({
      donorId: req.user._id,
      foodName,
      category,
      quantity,
      image: imageData,
      preparationDate,
      expiryDate,
      pickupAddress,
      description,
    });

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address');

    res.status(201).json({ success: true, message: 'Donation posted successfully!', donation: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all available donations (for NGO view)
// @route   GET /api/donations
// @access  Private
const getDonations = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { foodName: { $regex: search, $options: 'i' } },
        { pickupAddress: { $regex: search, $options: 'i' } },
      ];
    }

    // Donors see only their own donations
    if (req.user.role === 'donor') {
      filter.donorId = req.user._id;
    }

    // NGOs see available + what they accepted
    if (req.user.role === 'ngo') {
      if (!status) {
        filter.status = 'Available';
      }
    }

    // Volunteers see assigned to them
    if (req.user.role === 'volunteer') {
      filter.volunteerId = req.user._id;
    }

    const donations = await Donation.find(filter)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone')
      .sort({ createdAt: -1 });

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
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
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
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (donation.status !== 'Available') {
      return res.status(400).json({ success: false, message: `Donation is already ${donation.status}.` });
    }

    donation.status = 'Accepted';
    donation.acceptedBy = req.user._id;
    await donation.save();

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone');

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
    const { volunteerId } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (!['Accepted'].includes(donation.status)) {
      return res.status(400).json({ success: false, message: 'Can only assign volunteer to an accepted donation.' });
    }

    donation.volunteerId = volunteerId;
    donation.status = 'Pickup Assigned';
    await donation.save();

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone');

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
    await donation.save();

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone');

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
    await donation.save();

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
  acceptDonation,
  assignVolunteer,
  updateStatus,
  cancelDonation,
  getMyDonations,
};
