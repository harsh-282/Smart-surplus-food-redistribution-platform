const DeliveryTracking = require('../models/DeliveryTracking');
const Donation = require('../models/Donation');

// @desc    Start live GPS tracking for an active delivery
// @route   POST /api/tracking/start
// @access  Volunteer
const startTracking = async (req, res) => {
  try {
    const { donationId, lat, lng } = req.body;

    if (!donationId || lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'Donation ID, latitude, and longitude are required.' });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({ success: false, message: 'Invalid GPS coordinates.' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation task not found.' });
    }

    if (donation.volunteerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to track this delivery.' });
    }

    if (!['Pickup Assigned', 'Picked Up', 'Delivered'].includes(donation.status)) {
      return res.status(400).json({ success: false, message: 'Tracking can only be started during an active delivery task.' });
    }

    const tracking = await DeliveryTracking.findOneAndUpdate(
      { donationId },
      {
        volunteerId: req.user._id,
        location: { lat: numLat, lng: numLng },
        trackingActive: true,
        lastUpdatedAt: new Date(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Live GPS tracking started.', tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update volunteer live GPS coordinates
// @route   PUT /api/tracking/update
// @access  Volunteer
const updateTracking = async (req, res) => {
  try {
    const { donationId, lat, lng } = req.body;

    if (!donationId || lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'Donation ID, latitude, and longitude are required.' });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({ success: false, message: 'Invalid GPS coordinates.' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation task not found.' });
    }

    if (donation.volunteerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update tracking for this delivery.' });
    }

    if (['Completed', 'Cancelled'].includes(donation.status)) {
      // Auto stop tracking if task is finished
      await DeliveryTracking.findOneAndUpdate({ donationId }, { trackingActive: false });
      return res.status(400).json({ success: false, message: 'Delivery task is completed or cancelled. Tracking stopped.' });
    }

    const tracking = await DeliveryTracking.findOneAndUpdate(
      { donationId },
      {
        volunteerId: req.user._id,
        location: { lat: numLat, lng: numLng },
        trackingActive: true,
        lastUpdatedAt: new Date(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stop live GPS tracking for a delivery
// @route   PUT /api/tracking/stop
// @access  Volunteer, NGO, Admin
const stopTracking = async (req, res) => {
  try {
    const { donationId } = req.body;

    if (!donationId) {
      return res.status(400).json({ success: false, message: 'Donation ID is required.' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation task not found.' });
    }

    const isAssignedVolunteer = donation.volunteerId?.toString() === req.user._id.toString();
    const isAcceptedNGO = donation.acceptedBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssignedVolunteer && !isAcceptedNGO && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to stop tracking for this delivery.' });
    }

    const tracking = await DeliveryTracking.findOneAndUpdate(
      { donationId },
      { trackingActive: false, lastUpdatedAt: new Date() },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'Delivery tracking stopped.', tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get latest live tracking status for an active delivery
// @route   GET /api/tracking/:donationId
// @access  Private (Authorized Volunteer, Donor, NGO, Admin)
const getTrackingStatus = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation task not found.' });
    }

    const userIdStr = req.user._id.toString();
    const isAssignedVolunteer = donation.volunteerId?.toString() === userIdStr;
    const isAcceptedNGO = donation.acceptedBy?.toString() === userIdStr;
    const isDonor = donation.donorId?.toString() === userIdStr;
    const isAdmin = req.user.role === 'admin';

    if (!isAssignedVolunteer && !isAcceptedNGO && !isDonor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view live tracking for this delivery.' });
    }

    const tracking = await DeliveryTracking.findOne({ donationId });

    if (!tracking) {
      return res.status(200).json({
        success: true,
        trackingActive: false,
        isStale: true,
        message: 'Tracking not started yet.',
        tracking: null,
      });
    }

    // Mark stale if last update > 3 minutes (180000ms) ago or trackingActive is false
    const timeDiffMs = Date.now() - new Date(tracking.lastUpdatedAt).getTime();
    const isStale = !tracking.trackingActive || timeDiffMs > 180000 || ['Completed', 'Cancelled'].includes(donation.status);

    res.status(200).json({
      success: true,
      trackingActive: tracking.trackingActive && !isStale,
      isStale,
      lastUpdatedAt: tracking.lastUpdatedAt,
      timeDiffSeconds: Math.round(timeDiffMs / 1000),
      location: tracking.location,
      tracking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startTracking,
  updateTracking,
  stopTracking,
  getTrackingStatus,
};
