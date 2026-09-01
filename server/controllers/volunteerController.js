const Volunteer = require('../models/Volunteer');
const Donation = require('../models/Donation');
const User = require('../models/User');

// @desc    Get volunteer profile
// @route   GET /api/volunteer/profile
// @access  Volunteer
const getVolunteerProfile = async (req, res) => {
  try {
    const profile = await Volunteer.findOne({ userId: req.user._id }).populate('userId', 'name email phone');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Volunteer profile not found.' });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update volunteer profile
// @route   PUT /api/volunteer/profile
// @access  Volunteer
const updateVolunteerProfile = async (req, res) => {
  try {
    const { phone, address, vehicleType, availability } = req.body;
    const profile = await Volunteer.findOneAndUpdate(
      { userId: req.user._id },
      { phone, address, vehicleType, availability },
      { new: true, runValidators: true, upsert: true }
    ).populate('userId', 'name email phone');

    res.status(200).json({ success: true, message: 'Profile updated!', profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assigned deliveries for this volunteer
// @route   GET /api/volunteer/deliveries
// @access  Volunteer
const getAssignedDeliveries = async (req, res) => {
  try {
    const deliveries = await Donation.find({ volunteerId: req.user._id })
      .populate('donorId', 'name email phone address')
      .populate('acceptedBy', 'name email phone')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: deliveries.length, deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all available volunteers (for NGO to assign)
// @route   GET /api/volunteer/available
// @access  NGO, Admin
const getAvailableVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find({ availability: 'Available' })
      .populate('userId', 'name email phone');
    res.status(200).json({ success: true, volunteers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getVolunteerProfile, updateVolunteerProfile, getAssignedDeliveries, getAvailableVolunteers };
