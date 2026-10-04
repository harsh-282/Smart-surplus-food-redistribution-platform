const express = require('express');
const router = express.Router();
const {
  generatePickupOtp,
  verifyPickupOtp,
  generateDeliveryOtp,
  verifyDeliveryOtp,
  getOtpStatus,
} = require('../controllers/otpController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/:donationId/pickup/generate', protect, authorize('donor', 'admin'), generatePickupOtp);
router.post('/:donationId/pickup/verify', protect, authorize('volunteer', 'admin'), verifyPickupOtp);

router.post('/:donationId/delivery/generate', protect, authorize('ngo', 'admin'), generateDeliveryOtp);
router.post('/:donationId/delivery/verify', protect, authorize('volunteer', 'admin'), verifyDeliveryOtp);

router.get('/:donationId/status', protect, getOtpStatus);

module.exports = router;
