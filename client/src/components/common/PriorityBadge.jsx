import { calculateDonationPriority } from '../../utils/donationPriorityHelper';

/**
 * Reusable Priority Badge Component
 * Displays priority icon, score, and label (e.g. 🔴 Critical Priority: 92)
 */
const PriorityBadge = ({ priority, donation, ngoCoords, ngoProfile, showScore = true, size = 'md' }) => {
  const p = priority || calculateDonationPriority(donation, ngoCoords, ngoProfile);

  if (p.isExpired) {
    return (
      <span
        className={`priority-badge priority-badge-expired size-${size}`}
        title="Expired Donation"
      >
        ⌛ Expired
      </span>
    );
  }

  return (
    <span
      className={`priority-badge ${p.badgeClass} size-${size}`}
      style={{
        backgroundColor: p.bg,
        borderColor: p.border,
        color: p.color,
      }}
      title={`Priority Score: ${p.score}/100 - ${p.label}`}
    >
      <span>{p.icon}</span>
      <span className="priority-badge-label">{p.label}</span>
      {showScore && <span className="priority-badge-score">({p.score})</span>}
    </span>
  );
};

export default PriorityBadge;
