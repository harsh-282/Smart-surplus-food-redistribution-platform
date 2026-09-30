const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const { checkAndTriggerExpiryNotifications, createNotification } = require('../utils/notificationHelper');
const { getVapidPublicKey, sendPushToUser } = require('../utils/webPushHelper');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    // Run automated expiry notification scan for current user
    await checkAndTriggerExpiryNotifications(req.user._id, req.user.role);

    const { isRead, limit = 50, page = 1 } = req.query;
    const filter = { recipient: req.user._id };

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('donationId', 'foodName category status expiryDate image pickupAddress quantity')
        .populate('sender', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    )
      .populate('donationId', 'foodName category status expiryDate image pickupAddress quantity')
      .populate('sender', 'name email role');

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all notifications for user
// @route   DELETE /api/notifications/clear-all
// @access  Private
const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully',
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// WEB PUSH NOTIFICATION ENDPOINTS
// ==========================================

// @desc    Get VAPID public key
// @route   GET /api/notifications/vapid-key
// @access  Private
const getVapidKey = async (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    res.status(200).json({
      success: true,
      publicKey,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Subscribe browser to Web Push
// @route   POST /api/notifications/subscribe
// @access  Private
const subscribePush = async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription object',
      });
    }

    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });

    if (existing) {
      existing.user = req.user._id;
      existing.keys = subscription.keys;
      existing.userAgent = userAgent || req.headers['user-agent'] || '';
      await existing.save();
    } else {
      await PushSubscription.create({
        user: req.user._id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: userAgent || req.headers['user-agent'] || '',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Web push subscription saved successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unsubscribe browser from Web Push
// @route   POST /api/notifications/unsubscribe
// @access  Private
const unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint, user: req.user._id });
    } else {
      await PushSubscription.deleteMany({ user: req.user._id });
    }

    res.status(200).json({
      success: true,
      message: 'Web push subscription removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send test push notification to user
// @route   POST /api/notifications/test-push
// @access  Private
const sendTestPush = async (req, res) => {
  try {
    const notif = await createNotification({
      recipient: req.user._id,
      title: '🎉 Web Push Notification Active!',
      message: `Hello ${req.user.name}! Push notifications are configured successfully for your ${req.user.role.toUpperCase()} account.`,
      type: 'GENERAL',
      metadata: { test: true },
    });

    res.status(200).json({
      success: true,
      message: 'Test notification triggered (in-app & web push)',
      notification: notif,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getVapidKey,
  subscribePush,
  unsubscribePush,
  sendTestPush,
};

