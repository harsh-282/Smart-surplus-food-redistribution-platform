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

const NGO = require('../models/NGO');

// @desc    Get assigned deliveries for this volunteer
// @route   GET /api/volunteer/deliveries
// @access  Volunteer
const getAssignedDeliveries = async (req, res) => {
  try {
    const deliveries = await Donation.find({ volunteerId: req.user._id })
      .populate('donorId', 'name email phone address locationCoordinates')
      .populate('acceptedBy', 'name email phone address locationCoordinates')
      .sort({ updatedAt: -1 });

    const populatedDeliveries = await Promise.all(
      deliveries.map(async (d) => {
        const donationObj = d.toObject();
        if (d.acceptedBy) {
          const ngoProfile = await NGO.findOne({ userId: d.acceptedBy._id }).select('address locationCoordinates organizationName');
          if (ngoProfile) {
            if (!donationObj.acceptedBy.address) donationObj.acceptedBy.address = ngoProfile.address;
            if (!donationObj.acceptedBy.locationCoordinates && ngoProfile.locationCoordinates) {
              donationObj.acceptedBy.locationCoordinates = ngoProfile.locationCoordinates;
            }
          }
        }
        return donationObj;
      })
    );

    res.status(200).json({ success: true, count: populatedDeliveries.length, deliveries: populatedDeliveries });
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
      .populate('userId', 'name email phone verificationStatus');

    const verifiedVolunteers = volunteers.filter(
      (v) => v.userId && v.userId.verificationStatus === 'Verified'
    );

    res.status(200).json({ success: true, volunteers: verifiedVolunteers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const { calculateVolunteerSuitability } = require('../utils/volunteerScoringEngine');

// @desc    Get smart rule-based suitable volunteers for an accepted donation
// @route   GET /api/volunteer/suitable/:donationId
// @access  NGO, Admin
const getSuitableVolunteers = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    const allVolunteers = await Volunteer.find().populate('userId', 'name email phone address locationCoordinates isActive verificationStatus');
    const activeVolunteers = allVolunteers.filter(
      (v) => v.userId && v.userId.isActive !== false && v.userId.verificationStatus === 'Verified'
    );

    const evaluatedVolunteers = await Promise.all(
      activeVolunteers.map(async (v) => {
        const activeDeliveriesCount = await Donation.countDocuments({
          volunteerId: v.userId._id,
          status: { $in: ['Pickup Assigned', 'Picked Up', 'Delivered'] },
        });

        const suitability = await calculateVolunteerSuitability(v, donation, activeDeliveriesCount);

        return {
          _id: v._id,
          userId: v.userId,
          availability: v.availability,
          phone: v.phone || v.userId?.phone,
          address: v.address || v.userId?.address,
          vehicleType: v.vehicleType || 'Motorcycle',
          completedDeliveries: v.completedDeliveries || 0,
          activeDeliveriesCount,
          isOverloaded: activeDeliveriesCount >= 5,
          isAvailable: v.availability === 'Available',
          suitability,
        };
      })
    );

    const recommendedVolunteers = evaluatedVolunteers
      .filter(v => v.isAvailable && !v.isOverloaded)
      .sort((a, b) => b.suitability.suitabilityScore - a.suitability.suitabilityScore);

    const unavailableVolunteers = evaluatedVolunteers
      .filter(v => !v.isAvailable || v.isOverloaded)
      .sort((a, b) => b.suitability.suitabilityScore - a.suitability.suitabilityScore);

    res.status(200).json({
      success: true,
      count: recommendedVolunteers.length,
      recommendedVolunteers,
      unavailableVolunteers,
      allVolunteers: evaluatedVolunteers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getVolunteerProfile,
  updateVolunteerProfile,
  getAssignedDeliveries,
  getAvailableVolunteers,
  getSuitableVolunteers,
};
