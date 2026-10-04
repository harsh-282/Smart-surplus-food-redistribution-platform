const express = require('express');
const router = express.Router();
const { createPOD, getPOD, confirmPOD } = require('../controllers/podController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/:donationId', protect, authorize('volunteer', 'admin'), upload.single('deliveryPhoto'), createPOD);
router.get('/:donationId', protect, getPOD);
router.put('/:donationId/confirm', protect, authorize('ngo', 'admin'), confirmPOD);

module.exports = router;
