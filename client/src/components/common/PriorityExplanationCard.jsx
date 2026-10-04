import PriorityBadge from './PriorityBadge';
import { calculateDonationPriority, PRIORITY_WEIGHTS } from '../../utils/donationPriorityHelper';

const PriorityExplanationCard = ({ donation, ngoCoords, ngoProfile, isDonorView = false }) => {
  if (!donation) return null;

  const priority = calculateDonationPriority(donation, ngoCoords, ngoProfile);

  if (priority.isExpired) return null;

  if (isDonorView) {
    // Simplified, clean view for Donors
    return (
      <div className="card priority-explanation-card donor-view">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⚡ Redistribution Priority Status
            </h4>
            <p className="text-muted text-sm" style={{ marginTop: '0.2rem', marginBottom: 0 }}>
              Calculated dynamically based on shelf-life and demand urgency.
            </p>
          </div>
          <PriorityBadge priority={priority} size="md" />
        </div>
      </div>
    );
  }

  // Full transparent view for NGOs & Admins
  return (
    <div className="card priority-explanation-card">
      <div className="priority-card-header">
        <div>
          <h3 className="priority-card-title">🎯 Smart Redistribution Priority Score</h3>
          <p className="priority-card-subtitle">
            Transparent rule-based scoring system for NGO decision-making.
          </p>
        </div>
        <PriorityBadge priority={priority} size="lg" />
      </div>

      <div className="priority-score-meter-wrap">
        <div className="priority-score-bar">
          <div className="priority-score-val">
            <span className="num">{priority.score}</span>
            <span className="max">/ 100</span>
          </div>
          <div className="priority-progress-track">
            <div
              className="priority-progress-fill"
              style={{
                width: `${priority.score}%`,
                backgroundColor: priority.color,
              }}
            />
          </div>
        </div>
      </div>

      <div className="priority-reasons-section">
        <h4 className="priority-reasons-heading">Why this score?</h4>
        <ul className="priority-reasons-list">
          {priority.reasons.map((reason, idx) => (
            <li key={idx} className="priority-reason-item">
              <span className="check-icon">✓</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Breakdown Breakdown Chips */}
      <div className="priority-breakdown-chips">
        <span className="chip" title={`Max ${PRIORITY_WEIGHTS.expiry} pts`}>
          ⏳ Expiry: <strong>+{priority.expiryScore}</strong>
        </span>
        <span className="chip" title={`Max ${PRIORITY_WEIGHTS.distance} pts`}>
          📍 Distance: <strong>+{priority.distanceScore}</strong>
        </span>
        <span className="chip" title={`Max ${PRIORITY_WEIGHTS.quantity} pts`}>
          ⚖️ Quantity: <strong>+{priority.quantityScore}</strong>
        </span>
        <span className="chip" title={`Max ${PRIORITY_WEIGHTS.category} pts`}>
          🥗 Category: <strong>+{priority.categoryScore}</strong>
        </span>
        {priority.isPreferenceMatch && (
          <span className="chip pref-chip" title={`Max ${PRIORITY_WEIGHTS.preference} pts`}>
            ⭐ NGO Match: <strong>+{priority.preferenceScore}</strong>
          </span>
        )}
      </div>
    </div>
  );
};

export default PriorityExplanationCard;
