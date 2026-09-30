const express = require('express');
const router = express.Router();
const {
  getVolunteerProfile,
  updateVolunteerProfile,
  getAssignedDeliveries,
  getAvailableVolunteers,
  getSuitableVolunteers,
} = require('../controllers/volunteerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/profile', protect, authorize('volunteer'), getVolunteerProfile);
router.put('/profile', protect, authorize('volunteer'), updateVolunteerProfile);
router.get('/deliveries', protect, authorize('volunteer'), getAssignedDeliveries);
router.get('/available', protect, authorize('ngo', 'admin'), getAvailableVolunteers);
router.get('/suitable/:donationId', protect, authorize('ngo', 'admin'), getSuitableVolunteers);

module.exports = router;
