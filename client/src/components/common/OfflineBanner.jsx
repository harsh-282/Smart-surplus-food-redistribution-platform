import { useState, useEffect } from 'react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="alert">
      <div className="offline-banner-content">
        <span className="offline-banner-icon">⚡</span>
        <span className="offline-banner-text">
          <strong>You are currently offline.</strong> Live backend data is unavailable. Please check your internet connection.
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;
