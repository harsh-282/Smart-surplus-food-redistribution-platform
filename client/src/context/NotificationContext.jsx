import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import {
  isPushNotificationSupported,
  registerServiceWorker,
  getPushSubscriptionState,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from '../utils/pushManager';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollingTimerRef = useRef(null);

  // Web Push State
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default'); // 'default' | 'granted' | 'denied' | 'unsupported'
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState(null);

  const checkPushState = useCallback(async () => {
    const state = await getPushSubscriptionState();
    setPushSupported(state.isSupported);
    setPushPermission(state.permission);
    setIsPushSubscribed(state.isSubscribed);
  }, []);

  // Register service worker on application mount
  useEffect(() => {
    if (isPushNotificationSupported()) {
      registerServiceWorker().then(() => {
        checkPushState();
      });
    }
  }, [checkPushState]);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [user]);

  // Initial fetch and periodic polling when user is logged in
  useEffect(() => {
    if (user) {
      fetchNotifications(true);
      checkPushState();

      // Poll notifications every 30 seconds for in-app bell
      pollingTimerRef.current = setInterval(() => {
        fetchNotifications(false);
      }, 30000);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    }

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [user, fetchNotifications, checkPushState]);

  const enablePushNotifications = async () => {
    setPushLoading(true);
    setPushStatusMessage(null);
    try {
      await subscribeUserToPush(api);
      await checkPushState();
      setPushStatusMessage({ type: 'success', text: '🔔 Web push notifications enabled successfully!' });
      return true;
    } catch (err) {
      console.error('Push notification enable error:', err);
      setPushStatusMessage({ type: 'error', text: err.message || 'Failed to enable push notifications.' });
      await checkPushState();
      return false;
    } finally {
      setPushLoading(false);
    }
  };

  const disablePushNotifications = async () => {
    setPushLoading(true);
    setPushStatusMessage(null);
    try {
      await unsubscribeUserFromPush(api);
      await checkPushState();
      setPushStatusMessage({ type: 'info', text: 'Web push notifications disabled for this browser.' });
      return true;
    } catch (err) {
      console.error('Push notification disable error:', err);
      setPushStatusMessage({ type: 'error', text: 'Failed to disable push notifications.' });
      return false;
    } finally {
      setPushLoading(false);
    }
  };

  const sendTestPushNotification = async () => {
    try {
      setPushLoading(true);
      const res = await api.post('/notifications/test-push');
      if (res.data?.success) {
        fetchNotifications(false);
        setPushStatusMessage({ type: 'success', text: '🎉 Test notification sent!' });
      }
    } catch (err) {
      console.error('Test push failed:', err);
      setPushStatusMessage({ type: 'error', text: 'Failed to send test push notification.' });
    } finally {
      setPushLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const res = await api.put(`/notifications/${id}/read`);
      if (res.data?.success && res.data.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert/refresh on error
      fetchNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await api.put('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      fetchNotifications(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const target = notifications.find((n) => n._id === id);
      const wasUnread = target && !target.isRead;

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      const res = await api.delete(`/notifications/${id}`);
      if (res.data?.success && res.data.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotifications(false);
    }
  };

  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await api.delete('/notifications/clear-all');
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      fetchNotifications(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        // Web Push state & actions
        pushSupported,
        pushPermission,
        isPushSubscribed,
        pushLoading,
        pushStatusMessage,
        enablePushNotifications,
        disablePushNotifications,
        sendTestPushNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

