const Notification = require('../models/Notification');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { isExpired, isExpiringSoon, getTimeRemaining } = require('./expiryHelper');
const { sendPushToUser } = require('./webPushHelper');

/**
 * Creates a single notification
 * @param {Object} data - { recipient, sender, title, message, type, donationId, metadata }
 * @returns {Promise<Notification|null>}
 */
const createNotification = async ({
  recipient,
  sender = null,
  title,
  message,
  type = 'GENERAL',
  donationId = null,
  metadata = {},
}) => {
  try {
    if (!recipient || !title || !message) {
      console.warn('⚠️ Missing required fields for createNotification');
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      title,
      message,
      type,
      donationId,
      metadata,
    });

    // Asynchronously dispatch Web Push Notification if device subscription exists
    sendPushToUser(recipient, {
      title,
      message,
      type,
      donationId,
      metadata,
    }).catch((pushErr) => {
      console.error('Web Push send warning:', pushErr.message);
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

/**
 * Creates notifications for multiple recipients
 * @param {Array<string|ObjectId>} recipientIds 
 * @param {Object} data - { sender, title, message, type, donationId, metadata }
 * @returns {Promise<Array<Notification>>}
 */
const notifyMultipleUsers = async (recipientIds, data) => {
  try {
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) return [];

    const docs = recipientIds.map((recipient) => ({
      recipient,
      sender: data.sender || null,
      title: data.title,
      message: data.message,
      type: data.type || 'GENERAL',
      donationId: data.donationId || null,
      metadata: data.metadata || {},
    }));

    const notifications = await Notification.insertMany(docs);

    // Asynchronously dispatch Web Push Notification for each recipient
    notifications.forEach((notif) => {
      sendPushToUser(notif.recipient, {
        title: notif.title,
        message: notif.message,
        type: notif.type,
        donationId: notif.donationId,
        metadata: notif.metadata,
      }).catch((pushErr) => {
        console.error('Web Push send warning:', pushErr.message);
      });
    });

    return notifications;
  } catch (error) {
    console.error('Error in notifyMultipleUsers:', error.message);
    return [];
  }
};

/**
 * Automatically checks active donations and triggers near-expiry and expired notifications
 * Avoids duplicate notifications for the same donation and recipient.
 * @param {string|ObjectId} [userId] - Optional specific user to check for
 * @param {string} [role] - User role
 */
const checkAndTriggerExpiryNotifications = async (userId = null, role = null) => {
  try {
    let filter = {};

    if (userId && role === 'donor') {
      filter.donorId = userId;
    } else if (userId && role === 'ngo') {
      filter.acceptedBy = userId;
    } else if (userId && role === 'volunteer') {
      filter.volunteerId = userId;
    }

    // Only inspect active, uncompleted, uncancelled donations
    filter.status = { $nin: ['Completed', 'Cancelled'] };

    const donations = await Donation.find(filter).lean();
    if (!donations || donations.length === 0) return;

    for (const donation of donations) {
      const now = new Date();
      const expired = isExpired(donation.expiryDate, now);
      const expiringSoon = !expired && isExpiringSoon(donation.expiryDate, now);

      // 1. Expiring Soon Notification (< 24h)
      if (expiringSoon) {
        // Check if donor already received EXPIRY_WARNING for this donation
        const existingWarning = await Notification.findOne({
          recipient: donation.donorId,
          donationId: donation._id,
          type: 'EXPIRY_WARNING',
        });

        if (!existingWarning) {
          const timeLeft = getTimeRemaining(donation.expiryDate, now);
          await createNotification({
            recipient: donation.donorId,
            title: 'Food Expiring Soon ⚡',
            message: `Urgent: Your donation "${donation.foodName}" (${donation.quantity}) will expire soon (${timeLeft}). Please ensure pickup is completed.`,
            type: 'EXPIRY_WARNING',
            donationId: donation._id,
            metadata: { foodName: donation.foodName, status: donation.status },
          });
        }
      }

      // 2. Expired Notification (Past expiry date and was still Available / Pending)
      if (expired && donation.status === 'Available') {
        // Check if donor already received DONATION_EXPIRED for this donation
        const existingExpired = await Notification.findOne({
          recipient: donation.donorId,
          donationId: donation._id,
          type: 'DONATION_EXPIRED',
        });

        if (!existingExpired) {
          await createNotification({
            recipient: donation.donorId,
            title: 'Food Donation Expired ⌛',
            message: `Your food donation "${donation.foodName}" has passed its expiry time and is no longer available for NGO acceptance.`,
            type: 'DONATION_EXPIRED',
            donationId: donation._id,
            metadata: { foodName: donation.foodName, status: donation.status },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking expiry notifications:', error.message);
  }
};

module.exports = {
  createNotification,
  notifyMultipleUsers,
  checkAndTriggerExpiryNotifications,
};
