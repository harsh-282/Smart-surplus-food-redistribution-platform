import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const TIMELINE = [
  { status: 'Available',       icon: '🟢', label: 'Posted' },
  { status: 'Accepted',        icon: '✅', label: 'Accepted by NGO' },
  { status: 'Pickup Assigned', icon: '🚴', label: 'Volunteer Assigned' },
  { status: 'Picked Up',       icon: '📦', label: 'Food Picked Up' },
  { status: 'Delivered',       icon: '🚚', label: 'Delivered' },
  { status: 'Completed',       icon: '🎉', label: 'Completed' },
];

const STATUS_ORDER = ['Available', 'Accepted', 'Pickup Assigned', 'Picked Up', 'Delivered', 'Completed'];

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/donations/${id}`).then(res => setDonation(res.data.donation)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this donation?')) return;
    setCancelling(true);
    try {
      await api.put(`/donations/${id}/cancel`);
      setDonation(prev => ({ ...prev, status: 'Cancelled' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!donation) return <div className="empty-state"><div className="empty-state-icon">❌</div><div className="empty-state-title">Donation not found</div><Link to="/donor/my-donations" className="btn btn-secondary">Back</Link></div>;

  const currentIdx = STATUS_ORDER.indexOf(donation.status);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="back-btn">← Back to My Donations</button>

      <div className="grid-2" style={{ alignItems: 'flex-start', gap: '1.5rem' }}>
        {/* Left: Main Info */}
        <div>
          <div className="detail-header">
            {donation.image?.url ? (
              <img src={donation.image.url} alt={donation.foodName} className="detail-img" />
            ) : (
              <div className="detail-img-placeholder">🍽️</div>
            )}
            <div className="detail-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{donation.foodName}</h1>
                <StatusBadge status={donation.status} />
              </div>

              <div className="detail-grid">
                <div className="detail-field"><label>Category</label><p>📂 {donation.category}</p></div>
                <div className="detail-field"><label>Quantity</label><p>⚖️ {donation.quantity}</p></div>
                <div className="detail-field"><label>Prepared</label><p>{formatDateTime(donation.preparationDate)}</p></div>
                <div className="detail-field"><label>Expires</label><p>{formatDateTime(donation.expiryDate)}</p></div>
                <div className="detail-field" style={{ gridColumn: '1/-1' }}><label>Pickup Address</label><p>📍 {donation.pickupAddress}</p></div>
                {donation.description && <div className="detail-field" style={{ gridColumn: '1/-1' }}><label>Description</label><p>{donation.description}</p></div>}
                {donation.acceptedBy && <div className="detail-field"><label>Accepted By</label><p>🏢 {donation.acceptedBy.name}</p></div>}
                {donation.volunteerId && <div className="detail-field"><label>Volunteer</label><p>🚴 {donation.volunteerId.name}</p></div>}
              </div>

              {['Available', 'Accepted'].includes(donation.status) && (
                <div style={{ marginTop: '1rem' }}>
                  <button onClick={handleCancel} className="btn btn-danger" disabled={cancelling}>
                    {cancelling ? 'Cancelling...' : '❌ Cancel Donation'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Timeline */}
        <div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem' }}>📍 Donation Journey</h3>
            <div className="timeline">
              {TIMELINE.map((step, i) => {
                const stepIdx = STATUS_ORDER.indexOf(step.status);
                let dotCls = 'pending';
                if (donation.status === 'Cancelled') {
                  dotCls = i === 0 ? 'done' : 'pending';
                } else if (stepIdx < currentIdx) dotCls = 'done';
                else if (stepIdx === currentIdx) dotCls = 'current';
                return (
                  <div key={step.status} className="timeline-item">
                    <div className={`timeline-dot ${dotCls}`}>{step.icon}</div>
                    <div className="timeline-content">
                      <div className="timeline-label" style={{ color: dotCls === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{step.label}</div>
                      {dotCls === 'done' && <p style={{ color: 'var(--green-400)' }}>✓ Completed</p>}
                      {dotCls === 'current' && <p style={{ color: 'var(--orange-400)' }}>● Current Status</p>}
                    </div>
                  </div>
                );
              })}
              {donation.status === 'Cancelled' && (
                <div className="timeline-item">
                  <div className="timeline-dot" style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid #ef4444' }}>❌</div>
                  <div className="timeline-content">
                    <div className="timeline-label" style={{ color: '#ef4444' }}>Cancelled</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationDetails;
