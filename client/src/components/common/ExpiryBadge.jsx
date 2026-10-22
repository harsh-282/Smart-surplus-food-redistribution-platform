import { useState, useEffect } from 'react';
import { getExpiryInfo } from '../../utils/expiryHelper';

const EXPIRY_CONFIG = {
  'Fresh': {
    cls: 'badge-expiry-fresh',
    icon: '🟢',
    label: 'Fresh',
  },
  'Expiring Soon': {
    cls: 'badge-expiry-soon',
    icon: '⚡',
    label: 'Expiring Soon',
  },
  'Expired': {
    cls: 'badge-expiry-expired',
    icon: '⌛',
    label: 'Expired',
  },
};

const ExpiryBadge = ({ expiryDate, showTime = false, className = '', status = '', donation = null }) => {
  const effectiveStatus = status || donation?.status || '';

  // Once donation is completed (or finished), do not tag it as expired
  if (['Completed', 'Delivered'].includes(effectiveStatus)) {
    return null;
  }

  const [info, setInfo] = useState(() => getExpiryInfo(expiryDate, new Date(), effectiveStatus));

  useEffect(() => {
    setInfo(getExpiryInfo(expiryDate, new Date(), effectiveStatus));

    // Update countdown every 60 seconds
    const timer = setInterval(() => {
      setInfo(getExpiryInfo(expiryDate, new Date(), effectiveStatus));
    }, 60000);

    return () => clearInterval(timer);
  }, [expiryDate, effectiveStatus]);

  if (!expiryDate || ['Completed', 'Delivered'].includes(effectiveStatus) || info.status === 'Completed') {
    return null;
  }

  const config = EXPIRY_CONFIG[info.status];
  if (!config) return null;

  return (
    <span className={`badge ${config.cls} ${className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {showTime && (
        <span className="badge-time-text">
          • {info.timeLeft}
        </span>
      )}
    </span>
  );
};

export default ExpiryBadge;
