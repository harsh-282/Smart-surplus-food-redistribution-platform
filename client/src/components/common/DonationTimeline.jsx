import { useMemo } from 'react';
import QRDonationBadge from './QRDonationBadge';
import VerificationBadge from './VerificationBadge';

const STAGE_ORDER = [
  'Available',
  'Accepted',
  'Pickup Assigned',
  'Picked Up',
  'Delivered',
  'Completed',
];

const STAGES = [
  { key: 'Available', label: 'Donation Posted', icon: '🟢', defaultMsg: 'Donation posted and listed as available for NGO redistribution.' },
  { key: 'Accepted', label: 'Claimed by NGO', icon: '✅', defaultMsg: 'Food donation claimed by an NGO for community redistribution.' },
  { key: 'Pickup Assigned', label: 'Volunteer Assigned', icon: '🚴', defaultMsg: 'Delivery volunteer assigned for pickup and transport.' },
  { key: 'Picked Up', label: 'Food Picked Up', icon: '📦', defaultMsg: 'Food collected from donor pickup location.' },
  { key: 'Delivered', label: 'Food Delivered', icon: '🚚', defaultMsg: 'Surplus food delivered to NGO distribution center.' },
  { key: 'Completed', label: 'Completed', icon: '🎉', defaultMsg: 'Donation workflow and community redistribution completed.' },
];

const formatDateTime = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (ms) => {
  if (ms == null || isNaN(ms) || ms < 0) return null;
  const totalMins = Math.floor(ms / (1000 * 60));
  if (totalMins < 1) return '< 1 min';
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;

  if (days > 0) {
    return `${days}d ${remHrs}h`;
  }
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins} mins`;
};

const DonationTimeline = ({ donation, currentRole = '', showMetrics = true }) => {
  if (!donation) return null;

  const currentStatus = donation.status || 'Available';
  const isCancelled = currentStatus === 'Cancelled';
  const history = donation.statusHistory || [];

  // Build mapped historical lookup for exact status timestamps & messages
  const historyMap = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      if (h.status && !map[h.status]) {
        map[h.status] = h;
      }
    });
    return map;
  }, [history]);

  const currentIdx = STAGE_ORDER.indexOf(currentStatus);

  // Delivery Time Durations Calculation (Section 17)
  const metrics = useMemo(() => {
    if (!showMetrics) return null;

    const availableTime = historyMap['Available']?.timestamp ? new Date(historyMap['Available'].timestamp).getTime() : new Date(donation.createdAt).getTime();
    const acceptedTime = historyMap['Accepted']?.timestamp ? new Date(historyMap['Accepted'].timestamp).getTime() : null;
    const assignedTime = historyMap['Pickup Assigned']?.timestamp ? new Date(historyMap['Pickup Assigned'].timestamp).getTime() : null;
    const pickedUpTime = historyMap['Picked Up']?.timestamp ? new Date(historyMap['Picked Up'].timestamp).getTime() : null;
    const deliveredTime = historyMap['Delivered']?.timestamp ? new Date(historyMap['Delivered'].timestamp).getTime() : null;
    const completedTime = historyMap['Completed']?.timestamp ? new Date(historyMap['Completed'].timestamp).getTime() : null;

    const claimDuration = availableTime && acceptedTime ? formatDuration(acceptedTime - availableTime) : null;
    const assignDuration = acceptedTime && assignedTime ? formatDuration(assignedTime - acceptedTime) : null;
    const pickupDuration = assignedTime && pickedUpTime ? formatDuration(pickedUpTime - assignedTime) : null;
    const transitDuration = pickedUpTime && deliveredTime ? formatDuration(deliveredTime - pickedUpTime) : null;
    const totalDuration = availableTime && (completedTime || deliveredTime) ? formatDuration((completedTime || deliveredTime) - availableTime) : null;

    return {
      claimDuration,
      assignDuration,
      pickupDuration,
      transitDuration,
      totalDuration,
    };
  }, [historyMap, donation.createdAt, showMetrics]);

  return (
    <div className="card donation-timeline-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📍 Donation Journey Tracker
          </h3>
          <p className="text-muted text-sm" style={{ marginTop: '0.2rem', marginBottom: 0 }}>
            Chronological lifecycle & timestamp audit history
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <QRDonationBadge donation={donation} />
          <span className="badge badge-primary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current: {currentStatus}
          </span>
        </div>
      </div>

      {(donation.acceptedBy || donation.volunteerId) && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.65rem 0.85rem', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '0.75rem', border: '1px solid var(--border-subtle, #e2e8f0)' }}>
          {donation.acceptedBy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <span className="text-muted">NGO:</span> <strong>{donation.acceptedBy.name || 'NGO'}</strong>
              <VerificationBadge status={donation.acceptedBy.verificationStatus || 'Verified'} role="ngo" size="xs" />
            </div>
          )}
          {donation.volunteerId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <span className="text-muted">Volunteer:</span> <strong>{donation.volunteerId.name || 'Volunteer'}</strong>
              <VerificationBadge status={donation.volunteerId.verificationStatus || 'Verified'} role="volunteer" size="xs" />
            </div>
          )}
        </div>
      )}

      {/* Timeline List */}
      <div className="timeline">
        {STAGES.map((stage, idx) => {
          const stageIdx = STAGE_ORDER.indexOf(stage.key);
          const historyEntry = historyMap[stage.key];
          const eventTimestamp = historyEntry?.timestamp || (stageIdx <= currentIdx ? donation.updatedAt : null);

          let stateClass = 'pending';
          let stateIcon = '○';

          if (isCancelled) {
            if (stageIdx === 0) {
              stateClass = 'done';
              stateIcon = '✓';
            } else {
              stateClass = 'pending';
              stateIcon = '○';
            }
          } else if (stageIdx < currentIdx) {
            stateClass = 'done';
            stateIcon = '✓';
          } else if (stageIdx === currentIdx) {
            stateClass = 'current';
            stateIcon = '●';
          }

          const isCompleted = stateClass === 'done';
          const isCurrent = stateClass === 'current';

          return (
            <div key={stage.key} className={`timeline-item ${stateClass}`}>
              <div className={`timeline-dot ${stateClass}`}>
                {isCompleted ? '✓' : isCurrent ? stage.icon : stateIcon}
              </div>

              <div className="timeline-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div className="timeline-label" style={{ fontWeight: 700, color: isCurrent ? 'var(--orange-400)' : isCompleted ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {stage.label}
                  </div>
                  {eventTimestamp && (isCompleted || isCurrent) && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      🕒 {formatDateTime(eventTimestamp)}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: isCurrent || isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)', margin: '0.25rem 0' }}>
                  {historyEntry?.message || stage.defaultMsg}
                </p>

                {historyEntry?.updatedBy?.name && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    👤 Updated by: <strong>{historyEntry.updatedBy.name}</strong> ({historyEntry.role || 'System'})
                  </div>
                )}

                {isCurrent && (
                  <div style={{ marginTop: '0.35rem' }}>
                    <span className="badge badge-warning" style={{ fontSize: '0.725rem', fontWeight: 700 }}>
                      ● Active Stage in Progress
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Terminal Cancelled Stage if Applicable */}
        {isCancelled && (
          <div className="timeline-item current">
            <div className="timeline-dot" style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid #ef4444', color: '#ef4444' }}>
              ❌
            </div>
            <div className="timeline-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div className="timeline-label" style={{ fontWeight: 700, color: '#ef4444' }}>
                  Donation Cancelled
                </div>
                {donation.updatedAt && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    🕒 {formatDateTime(donation.updatedAt)}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.25rem' }}>
                {historyMap['Cancelled']?.message || 'This surplus food donation was cancelled and is no longer active.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Duration Metrics Bar (Section 17) */}
      {metrics && (metrics.claimDuration || metrics.pickupDuration || metrics.transitDuration || metrics.totalDuration) && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
          <span className="pills-label">⏱️ Duration Metrics:</span>
          {metrics.claimDuration && (
            <span className="chip" title="Time taken from donation creation to NGO claim">
              Time to Claim: <strong>{metrics.claimDuration}</strong>
            </span>
          )}
          {metrics.pickupDuration && (
            <span className="chip" title="Time taken from assignment to volunteer pickup">
              Time to Pickup: <strong>{metrics.pickupDuration}</strong>
            </span>
          )}
          {metrics.transitDuration && (
            <span className="chip" title="Time taken in transit from donor to NGO">
              Delivery Transit: <strong>{metrics.transitDuration}</strong>
            </span>
          )}
          {metrics.totalDuration && (
            <span className="chip pref-chip" title="Total processing time from posting to completion">
              Total Lifecycle: <strong>{metrics.totalDuration}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DonationTimeline;
