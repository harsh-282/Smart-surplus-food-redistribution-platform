import { useState, useEffect } from 'react';
import api from '../../services/api';

const SmartVolunteerSelector = ({ donationId, donation, onAssigned }) => {
  const [recommended, setRecommended] = useState([]);
  const [unavailable, setUnavailable] = useState([]);
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('smart'); // 'smart' | 'manual'
  const [selectedManualId, setSelectedManualId] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchSuitableVolunteers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/volunteer/suitable/${donationId}`);
      setRecommended(res.data.recommendedVolunteers || []);
      setUnavailable(res.data.unavailableVolunteers || []);
      setAllVolunteers(res.data.allVolunteers || []);
    } catch (err) {
      console.error('Failed to fetch suitable volunteers:', err);
      setError('Could not calculate volunteer suitability recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (donationId) {
      fetchSuitableVolunteers();
    }
  }, [donationId]);

  const handleAssign = async (volUserId, volName) => {
    if (!volUserId) return;
    if (!window.confirm(`Are you sure you want to assign ${volName} to this delivery task?`)) {
      return;
    }

    setAssigningId(volUserId);
    setError('');
    try {
      const res = await api.put(`/donations/${donationId}/assign-volunteer`, {
        volunteerId: volUserId,
      });
      if (onAssigned) {
        onAssigned(res.data.donation);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign volunteer.');
    } finally {
      setAssigningId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span className="spinner-sm" /> Evaluating suitable volunteers & proximity...
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setViewMode('smart')}
          className={`btn btn-sm ${viewMode === 'smart' ? 'btn-primary' : 'btn-secondary'}`}
        >
          ⭐ Smart Recommendations ({recommended.length})
        </button>
        <button
          onClick={() => setViewMode('manual')}
          className={`btn btn-sm ${viewMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📋 Manual Selection ({allVolunteers.length})
        </button>
      </div>

      {/* Mode 1: Smart Recommendations */}
      {viewMode === 'smart' && (
        <div>
          {recommended.length === 0 ? (
            <div className="alert alert-warning" style={{ fontSize: '0.875rem' }}>
              ℹ️ No active available volunteers match optimal suitability criteria right now. Switch to <strong>Manual Selection</strong> to assign any registered volunteer.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rule-Based Suitability Ranking
              </div>

              {recommended.map((vol, index) => {
                const volUserId = vol.userId?._id || vol._id;
                const volName = vol.userId?.name || 'Volunteer';
                const suitability = vol.suitability || {};
                const rankBadge = index === 0 ? '🥇 #1 Best Match' : index === 1 ? '🥈 #2 Match' : index === 2 ? '🥉 #3 Match' : `#${index + 1} Match`;
                const isExpanded = expandedId === vol._id;

                const levelColor = suitability.suitabilityLevel === 'High' ? '#16a34a' : suitability.suitabilityLevel === 'Medium' ? '#2563eb' : '#d97706';
                const levelBg = suitability.suitabilityLevel === 'High' ? 'rgba(22,163,74,0.08)' : suitability.suitabilityLevel === 'Medium' ? 'rgba(37,99,235,0.08)' : 'rgba(217,119,6,0.08)';

                return (
                  <div
                    key={vol._id}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `1.5px solid ${index === 0 ? '#16a34a' : 'var(--border-color, #cbd5e1)'}`,
                      background: index === 0 ? 'rgba(22, 163, 74, 0.03)' : 'var(--bg-card, #ffffff)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '1.05rem' }}>🚴 {volName}</strong>
                          <span className="badge" style={{ background: levelBg, color: levelColor, border: `1px solid ${levelColor}`, fontWeight: 700 }}>
                            {rankBadge} • {suitability.suitabilityPercentage}% Suitability
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                          📞 {vol.phone || 'N/A'} | 📍 {vol.address || 'Address registered'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAssign(volUserId, volName)}
                        className="btn btn-primary btn-sm"
                        disabled={assigningId === volUserId}
                        style={{ minWidth: '130px' }}
                      >
                        {assigningId === volUserId ? 'Assigning...' : 'Assign Volunteer'}
                      </button>
                    </div>

                    {/* Chips info */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.6rem 0 0.5rem 0' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                        ⚡ {vol.activeDeliveriesCount} Active Task{vol.activeDeliveriesCount === 1 ? '' : 's'}
                      </span>
                      <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                        🛵 Vehicle: {vol.vehicleType}
                      </span>
                      {suitability.distanceKm != null && (
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          📍 ~{suitability.distanceKm.toFixed(1)} km to pickup
                        </span>
                      )}
                    </div>

                    {/* Suitability Score Bar */}
                    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${suitability.suitabilityPercentage}%`,
                            background: levelColor,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Expandable Reasons Breakdown */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(vol._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary-color, #16a34a)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {isExpanded ? '▲ Hide Suitability Score Breakdown' : '▼ View Suitability Score Breakdown'}
                      </button>

                      {isExpanded && (
                        <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color, #e2e8f0)' }}>
                          <strong style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                            Transparent Scoring Calculation (Rule-Based):
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                            {suitability.breakdown?.map((item, idx) => (
                              <li key={idx} style={{ marginBottom: '0.2rem' }}>
                                <strong>{item.factor}:</strong> {item.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Manual Selection */}
      {viewMode === 'manual' && (
        <div style={{ padding: '0.5rem 0' }}>
          <div className="form-group mb-3">
            <label className="form-label">Choose Any Available Volunteer</label>
            <select
              className="form-control"
              value={selectedManualId}
              onChange={(e) => setSelectedManualId(e.target.value)}
            >
              <option value="">-- Select Volunteer --</option>
              {allVolunteers.map((vol) => {
                const volUserId = vol.userId?._id || vol._id;
                const volName = vol.userId?.name || 'Volunteer';
                return (
                  <option key={vol._id} value={volUserId}>
                    🚴 {volName} ({vol.availability} | Active: {vol.activeDeliveriesCount} | {vol.vehicleType || 'Motorcycle'})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!selectedManualId || assigningId === selectedManualId}
            onClick={() => {
              const found = allVolunteers.find((v) => (v.userId?._id || v._id) === selectedManualId);
              const name = found?.userId?.name || 'Volunteer';
              handleAssign(selectedManualId, name);
            }}
          >
            {assigningId ? 'Assigning...' : 'Confirm Manual Assignment'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartVolunteerSelector;
