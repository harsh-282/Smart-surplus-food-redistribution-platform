import StatusBadge from './StatusBadge';
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

  return (
    <div className="donation-card">
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
          <span>⏰ Expires: {formatDate(donation.expiryDate)}</span>
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
