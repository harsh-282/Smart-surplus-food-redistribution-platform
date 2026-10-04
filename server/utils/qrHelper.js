const Donation = require('../models/Donation');

/**
 * Generates a unique QR donation ID (e.g. FS-DON-2026-839210)
 * @returns {Promise<string>}
 */
const generateUniqueQrDonationId = async () => {
  const year = new Date().getFullYear();
  let qrId = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 15) {
    const random = Math.floor(100000 + Math.random() * 900000);
    qrId = `FS-DON-${year}-${random}`;
    const found = await Donation.findOne({ qrDonationId: qrId });
    if (!found) exists = false;
    attempts++;
  }

  return qrId;
};

/**
 * Ensures a donation document or object has a valid qrDonationId
 * @param {Object} donation 
 * @returns {Promise<Object>}
 */
const ensureQrDonationId = async (donation) => {
  if (!donation) return donation;

  if (!donation.qrDonationId) {
    const newQrId = await generateUniqueQrDonationId();
    donation.qrDonationId = newQrId;
    donation.qrCreatedAt = new Date();

    // If it is a Mongoose document instance, save it to DB
    if (typeof donation.save === 'function') {
      try {
        await donation.save();
      } catch (err) {
        console.error('Error saving qrDonationId to donation:', err.message);
      }
    }
  }

  return donation;
};

module.exports = {
  generateUniqueQrDonationId,
  ensureQrDonationId,
};
