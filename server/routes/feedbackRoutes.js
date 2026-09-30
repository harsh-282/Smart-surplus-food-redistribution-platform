const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getDonationFeedback,
  getUserRatingSummary,
  getAdminFeedbackSummary,
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protected routes for all authenticated users involved
router.post('/', protect, submitFeedback);
router.get('/donation/:donationId', protect, getDonationFeedback);
router.get('/user/:userId', protect, getUserRatingSummary);

// Protected route for Admin rating summary
router.get('/admin/summary', protect, authorize('admin'), getAdminFeedbackSummary);

module.exports = router;
