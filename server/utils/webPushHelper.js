const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BJNvHUJJJL93bGXDe777BMPiRlOPf9UnivjHVcg_rbRkRTa-8wwwcVHbhLRvv55Nh1ZxAR-Zc8Qq3TYRAKpjrQw';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'rMfyXSzcQ5B8D_dpTeZ4Tzvkr7MpMETQVVl0az42-IE';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@foodshare.org';

// Initialize web-push configuration
try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('✅ Web Push VAPID details configured');
} catch (err) {
  console.error('⚠️ Web Push initialization failed:', err.message);
}

/**
 * Returns the public VAPID key
 */
const getVapidPublicKey = () => VAPID_PUBLIC_KEY;

/**
 * Sends web push notification to a user's registered devices
 * @param {string|ObjectId} userId 
 * @param {Object} payloadData - { title, message, type, donationId, url, metadata }
 */
const sendPushToUser = async (userId, payloadData) => {
  if (!userId) return;

  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title: payloadData.title || 'FoodShare Notification',
      message: payloadData.message || '',
      type: payloadData.type || 'GENERAL',
      donationId: payloadData.donationId || null,
      url: payloadData.url || (payloadData.donationId ? `/donor/donations/${payloadData.donationId}` : '/'),
      createdAt: new Date().toISOString(),
      metadata: payloadData.metadata || {},
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error) {
        // If subscription has expired or is invalid (404/410), clean it up from MongoDB
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`🧹 Removing stale push subscription (${sub.endpoint})`);
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`⚠️ Error sending push to endpoint ${sub.endpoint}:`, error.message);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error in sendPushToUser:', error.message);
  }
};

module.exports = {
  getVapidPublicKey,
  sendPushToUser,
};
