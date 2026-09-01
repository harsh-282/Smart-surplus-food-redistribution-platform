const express = require('express');
const router = express.Router();
const { getNGOProfile, updateNGOProfile, getNGODonations } = require('../controllers/ngoController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/profile', protect, authorize('ngo'), getNGOProfile);
router.put('/profile', protect, authorize('ngo'), updateNGOProfile);
router.get('/donations', protect, authorize('ngo'), getNGODonations);

module.exports = router;
