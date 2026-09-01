const NGO = require('../models/NGO');
const Donation = require('../models/Donation');

// @desc    Get NGO profile
// @route   GET /api/ngo/profile
// @access  NGO
const getNGOProfile = async (req, res) => {
  try {
    const profile = await NGO.findOne({ userId: req.user._id }).populate('userId', 'name email phone');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'NGO profile not found.' });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update NGO profile
// @route   PUT /api/ngo/profile
// @access  NGO
const updateNGOProfile = async (req, res) => {
  try {
    const { organizationName, contactPerson, phone, address, description, registrationNumber } = req.body;
    const profile = await NGO.findOneAndUpdate(
      { userId: req.user._id },
      { organizationName, contactPerson, phone, address, description, registrationNumber },
      { new: true, runValidators: true, upsert: true }
    ).populate('userId', 'name email phone');

    res.status(200).json({ success: true, message: 'Profile updated!', profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get accepted donations for this NGO
// @route   GET /api/ngo/donations
// @access  NGO
const getNGODonations = async (req, res) => {
  try {
    const donations = await Donation.find({ acceptedBy: req.user._id })
      .populate('donorId', 'name email phone address')
      .populate('volunteerId', 'name email phone')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNGOProfile, updateNGOProfile, getNGODonations };
