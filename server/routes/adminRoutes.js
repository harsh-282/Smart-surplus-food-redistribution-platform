const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  getAllDonations,
  adminCancelDonation,
  getAnalytics,
  getVerificationRequests,
  getUserVerificationDetails,
  updateUserVerificationStatus,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/donations', getAllDonations);
router.put('/donations/:id/cancel', adminCancelDonation);

// Verification routes
router.get('/verification-requests', getVerificationRequests);
router.get('/verification-details/:id', getUserVerificationDetails);
router.put('/verify-user/:id', updateUserVerificationStatus);

module.exports = router;


