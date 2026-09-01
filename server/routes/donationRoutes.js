const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonation,
  acceptDonation,
  assignVolunteer,
  updateStatus,
  cancelDonation,
  getMyDonations,
} = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/my', protect, authorize('donor'), getMyDonations);
router.get('/', protect, getDonations);
router.post('/', protect, authorize('donor'), upload.single('image'), createDonation);
router.get('/:id', protect, getDonation);
router.put('/:id/accept', protect, authorize('ngo'), acceptDonation);
router.put('/:id/assign-volunteer', protect, authorize('ngo', 'admin'), assignVolunteer);
router.put('/:id/status', protect, authorize('volunteer', 'admin'), updateStatus);
router.put('/:id/cancel', protect, authorize('donor', 'admin'), cancelDonation);

module.exports = router;
