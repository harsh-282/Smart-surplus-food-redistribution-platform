import StatusBadge from './StatusBadge';
import ExpiryBadge from './ExpiryBadge';
import { getExpiryInfo } from '../../utils/expiryHelper';
import { Link } from 'react-router-dom';

const CATEGORY_EMOJI = {
  'Cooked Food': '🍛',
  'Raw Vegetables': '🥦',
  'Fruits': '🍎',
  'Packaged Food': '📦',
  'Bakery': '🍞',
  'Dairy': '🥛',
  'Beverages': '🥤',
  'Other': '🥗',
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const DonationCard = ({ donation, detailLink, actionButton }) => {
  const emoji = CATEGORY_EMOJI[donation.category] || '🍽️';
  const expiryInfo = getExpiryInfo(donation.expiryDate);

  let cardClasses = 'donation-card';
  if (expiryInfo.isExpiringSoon) {
    cardClasses += ' donation-card-expiring-soon';
  } else if (expiryInfo.isExpired) {
    cardClasses += ' donation-card-expired';
  }

  return (
    <div className={cardClasses}>
      {expiryInfo.isExpiringSoon && (
        <div className="donation-card-expiring-banner">
          <span>⚡ EXPIRING SOON</span>
          <span>{expiryInfo.timeLeft}</span>
        </div>
      )}

      {donation.image?.url ? (
        <img
          src={donation.image.url}
          alt={donation.foodName}
          className="donation-card-img"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div
        className="donation-card-img-placeholder"
        style={{ display: donation.image?.url ? 'none' : 'flex' }}
      >
        {emoji}
      </div>

      <div className="donation-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h3 className="donation-card-title">{donation.foodName}</h3>
          <StatusBadge status={donation.status} />
        </div>

        <div className="donation-card-meta">
          <span>📂 {donation.category}</span>
          <span>⚖️ {donation.quantity}</span>
          <span>📍 {donation.pickupAddress?.slice(0, 50)}{donation.pickupAddress?.length > 50 ? '...' : ''}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', margin: '0.2rem 0' }}>
            <span>⏰ Expiry:</span>
            <ExpiryBadge expiryDate={donation.expiryDate} showTime={true} />
          </div>
          {donation.donorId?.name && <span>👤 By: {donation.donorId.name}</span>}
        </div>
      </div>

      <div className="donation-card-footer">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {formatDate(donation.createdAt)}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {actionButton}
          {detailLink && (
            <Link to={detailLink} className="btn btn-secondary btn-sm">View Details</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationCard;
