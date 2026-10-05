const NGO = require('../models/NGO');
const Donation = require('../models/Donation');

// @desc    Get NGO profile
// @route   GET /api/ngo/profile
// @access  NGO
// @desc    Get NGO profile
// @route   GET /api/ngo/profile
// @access  NGO
const getNGOProfile = async (req, res) => {
  try {
    let profile = await NGO.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email phone address locationCoordinates'
    );

    if (!profile) {
      // Auto-create basic profile if missing
      profile = await NGO.create({
        userId: req.user._id,
        organizationName: req.user.name,
        contactPerson: req.user.name,
        phone: req.user.phone || '',
        address: req.user.address || '',
        locationCoordinates: req.user.locationCoordinates || null,
      });
      profile = await NGO.findById(profile._id).populate(
        'userId',
        'name email phone address locationCoordinates'
      );
    }

    // Ensure locationCoordinates is populated from user if missing on profile
    const profileObj = profile.toObject();
    if (
      (!profileObj.locationCoordinates || profileObj.locationCoordinates.lat == null) &&
      req.user.locationCoordinates?.lat != null
    ) {
      profileObj.locationCoordinates = req.user.locationCoordinates;
    }

    res.status(200).json({ success: true, profile: profileObj, ngo: profileObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update NGO profile
// @route   PUT /api/ngo/profile
// @access  NGO
const updateNGOProfile = async (req, res) => {
  try {
    const {
      organizationName,
      contactPerson,
      phone,
      address,
      description,
      registrationNumber,
      servingCapacity,
      serviceArea,
      acceptedCategories,
      locationCoordinates,
    } = req.body;

    const updateFields = {
      organizationName,
      contactPerson,
      phone,
      address,
      description,
      registrationNumber,
      servingCapacity: servingCapacity ? Number(servingCapacity) : 100,
      serviceArea: serviceArea || '',
      acceptedCategories: Array.isArray(acceptedCategories) ? acceptedCategories : ['All'],
    };

    if (locationCoordinates && locationCoordinates.lat != null) {
      updateFields.locationCoordinates = locationCoordinates;
      // Also update coordinates on core User model
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, { locationCoordinates });
    }

    const profile = await NGO.findOneAndUpdate(
      { userId: req.user._id },
      updateFields,
      { new: true, runValidators: true, upsert: true }
    ).populate('userId', 'name email phone address locationCoordinates');

    const profileObj = profile.toObject();

    res.status(200).json({
      success: true,
      message: 'Profile updated!',
      profile: profileObj,
      ngo: profileObj,
    });
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
      .populate('donorId', 'name email phone address locationCoordinates')
      .populate('volunteerId', 'name email phone')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNGOProfile, updateNGOProfile, getNGODonations };
