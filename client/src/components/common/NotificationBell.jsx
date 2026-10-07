import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { IconBell, IconLeaf, IconCheckCircle, IconBike, IconPackage, IconZap, IconClock, IconX } from './Icons';

const NotifIconLeaf = () => <IconLeaf size={14} />;
const NotifIconCheck = () => <IconCheckCircle size={14} />;
const NotifIconBike = () => <IconBike size={14} />;
const NotifIconPkg = () => <IconPackage size={14} />;
const NotifIconZap = () => <IconZap size={14} />;
const NotifIconClock = () => <IconClock size={14} />;
const NotifIconBell = () => <IconBell size={14} />;

const TYPE_CONFIG = {
  DONATION_CREATED:   { IconComp: NotifIconLeaf,  cls: 'notif-icon-created' },
  DONATION_ACCEPTED:  { IconComp: NotifIconCheck, cls: 'notif-icon-accepted' },
  VOLUNTEER_ASSIGNED: { IconComp: NotifIconBike,  cls: 'notif-icon-assigned' },
  STATUS_CHANGED:     { IconComp: NotifIconPkg,   cls: 'notif-icon-status' },
  EXPIRY_WARNING:     { IconComp: NotifIconZap,   cls: 'notif-icon-warning' },
  DONATION_EXPIRED:   { IconComp: NotifIconClock, cls: 'notif-icon-expired' },
  GENERAL:            { IconComp: NotifIconBell,  cls: 'notif-icon-general' },
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    loading,
    pushSupported,
    pushPermission,
    isPushSubscribed,
    pushLoading,
    pushStatusMessage,
    enablePushNotifications,
    disablePushNotifications,
    sendTestPushNotification,
  } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    const donationId = notification.donationId?._id || notification.donationId;
    if (donationId && user) {
      setIsOpen(false);
      if (user.role === 'donor') {
        navigate(`/donor/donations/${donationId}`);
      } else if (user.role === 'ngo') {
        navigate(`/ngo/donations/${donationId}`);
      } else if (user.role === 'volunteer') {
        navigate(`/volunteer/deliveries/${donationId}`);
      } else if (user.role === 'admin') {
        navigate(`/admin/donations/${donationId}`);
      }
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleDropdown}
        title="Notifications"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <IconBell size={17} />
        {unreadCount > 0 && (
          <span className="notification-badge" id="notification-unread-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="notification-dropdown" role="dialog" aria-label="Notifications panel">
          {/* Header */}
          <div className="notification-header">
            <div className="notification-header-left">
              <span className="notification-header-title">Notifications</span>
              {unreadCount > 0 && (
                <span className="notification-unread-pill">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="notification-mark-all-btn"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                ✓ Mark all read
              </button>
            )}
          </div>

          {/* Web Push Permission / Subscription Banner */}
          {pushSupported && (
            <div className="web-push-banner">
              <div className="web-push-banner-inner">
                {pushPermission === 'denied' ? (
                  <div className="push-status-blocked">
                    <IconZap size={13} style={{flexShrink:0}}/> Browser notifications blocked. Enable in site settings.
                  </div>
                ) : isPushSubscribed ? (
                  <div className="push-status-active">
                    <span className="push-active-indicator"><IconCheckCircle size={13}/> Device Push Active</span>
                    <div className="push-active-actions">
                      <button
                        className="btn-push-action test"
                        onClick={sendTestPushNotification}
                        disabled={pushLoading}
                        title="Trigger test push notification"
                      >
                        {pushLoading ? 'Sending...' : <><IconZap size={12}/> Test Push</>}
                      </button>
                      <button
                        className="btn-push-action disable"
                        onClick={disablePushNotifications}
                        disabled={pushLoading}
                        title="Disable push notifications for this device"
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="push-status-enable">
                    <div className="push-enable-info">
                      <strong>Get Device Push Alerts</strong>
                      <span>Receive real-time alerts even when browser tab is closed.</span>
                    </div>
                    <button
                      className="btn-enable-push"
                      onClick={enablePushNotifications}
                      disabled={pushLoading}
                    >
                      {pushLoading ? 'Enabling...' : <><IconBell size={13}/> Enable Push</>}
                    </button>
                  </div>
                )}
              </div>
              {pushStatusMessage && (
                <div className={`push-feedback-msg ${pushStatusMessage.type}`}>
                  {pushStatusMessage.text}
                </div>
              )}
            </div>
          )}


          {/* Filter Tabs */}
          <div className="notification-tabs">
            <button
              className={`notification-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`notification-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="notification-empty-icon"><IconClock size={32}/></span>
                <p>Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                <span className="notification-empty-icon">
                  {filter === 'unread' ? <IconCheckCircle size={32}/> : <IconBell size={32}/>}
                </span>
                <p className="notification-empty-title">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="notification-empty-subtitle">
                  {filter === 'unread'
                    ? "You're all caught up!"
                    : 'Updates about donations and pickups will appear here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.GENERAL;
                const hasDonationLink = Boolean(notif.donationId);

                return (
                  <div
                    key={notif._id}
                    className={`notification-item ${!notif.isRead ? 'unread' : ''} ${hasDonationLink ? 'clickable' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(notif);
                      }
                    }}
                  >
                    {/* Icon Badge */}
                    <div className={`notification-item-icon ${config.cls}`}>
                      <config.IconComp />
                    </div>

                    {/* Content */}
                    <div className="notification-item-content">
                      <div className="notification-item-header">
                        <span className="notification-item-title">{notif.title}</span>
                        {!notif.isRead && <span className="notification-unread-dot" />}
                      </div>
                      <p className="notification-item-message">{notif.message}</p>
                      <div className="notification-item-footer">
                        <span className="notification-item-time">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                        {hasDonationLink && (
                          <span className="notification-item-link-text">
                            View details →
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions on Hover */}
                    <div className="notification-item-actions" onClick={(e) => e.stopPropagation()}>
                      {!notif.isRead && (
                        <button
                          className="notification-action-btn"
                          onClick={() => markAsRead(notif._id)}
                          title="Mark as read"
                          aria-label="Mark as read"
                        >
                          <IconCheckCircle size={13}/>
                        </button>
                      )}
                      <button
                        className="notification-action-btn delete"
                        onClick={() => deleteNotification(notif._id)}
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <IconX size={12}/>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button
                className="notification-clear-btn"
                onClick={clearAllNotifications}
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
