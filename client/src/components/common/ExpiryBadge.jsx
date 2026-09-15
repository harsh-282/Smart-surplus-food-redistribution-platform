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

const ExpiryBadge = ({ expiryDate, showTime = false, className = '' }) => {
  const [info, setInfo] = useState(() => getExpiryInfo(expiryDate));

  useEffect(() => {
    setInfo(getExpiryInfo(expiryDate));

    // Update countdown every 60 seconds
    const timer = setInterval(() => {
      setInfo(getExpiryInfo(expiryDate));
    }, 60000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!expiryDate) return null;

  const config = EXPIRY_CONFIG[info.status] || EXPIRY_CONFIG['Expired'];

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
