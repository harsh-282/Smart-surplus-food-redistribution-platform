import { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const PushNotificationBanner = () => {
  const { user } = useAuth();
  const {
    pushSupported,
    pushPermission,
    isPushSubscribed,
    pushLoading,
    enablePushNotifications,
  } = useNotifications();

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Read local storage to see if user dismissed prompt for this session
    const isDismissed = localStorage.getItem('foodshare_push_prompt_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('foodshare_push_prompt_dismissed', 'true');
  };

  // Do not display banner if:
  // - Not logged in
  // - Push not supported
  // - Push permission is already denied
  // - User is already subscribed
  // - User explicitly dismissed the banner
  if (
    !user ||
    !pushSupported ||
    pushPermission === 'denied' ||
    isPushSubscribed ||
    dismissed
  ) {
    return null;
  }

  return (
    <div className="push-banner-prompt" role="region" aria-label="Enable notifications prompt">
      <div className="push-banner-content">
        <div className="push-banner-icon">🔔</div>
        <div className="push-banner-text">
          <h4>Enable Web Push Notifications</h4>
          <p>
            Stay updated on donation approvals, NGO claims, and volunteer delivery assignments in real-time on your mobile and desktop devices.
          </p>
        </div>
      </div>
      <div className="push-banner-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={enablePushNotifications}
          disabled={pushLoading}
        >
          {pushLoading ? 'Enabling...' : 'Allow Notifications'}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default PushNotificationBanner;
