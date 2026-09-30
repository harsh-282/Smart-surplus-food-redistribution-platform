const express = require('express');
const router = express.Router();
const {
  startTracking,
  updateTracking,
  stopTracking,
  getTrackingStatus,
} = require('../controllers/trackingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startTracking);
router.put('/update', protect, updateTracking);
router.put('/stop', protect, stopTracking);
router.get('/:donationId', protect, getTrackingStatus);

module.exports = router;
