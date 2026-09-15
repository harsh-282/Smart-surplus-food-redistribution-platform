import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import { getExpiryInfo } from '../../utils/expiryHelper';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const AdminDonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/donations/${id}`)
      .then(res => setDonation(res.data.donation))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this donation?')) return;
    setCancelling(true);
    try {
      await api.put(`/admin/donations/${id}/cancel`);
      setDonation(prev => ({ ...prev, status: 'Cancelled' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!donation) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-title">Donation not found</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">Back</button>
      </div>
    );
  }

  const expiryInfo = getExpiryInfo(donation.expiryDate);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="back-btn">← Back to Management</button>

      <div className="page-header">
        <h1 className="page-title">Donation Audit Detail</h1>
        <p className="page-subtitle">Detailed log audit for safety, quality control, expiry tracking, and logistics monitoring.</p>
      </div>

      {expiryInfo.isExpiringSoon && (
        <div className="detail-expiry-alert soon">
          <span>⚡</span>
          <div>
            <strong>Expiring Soon Audit:</strong> This food donation is within 24 hours of expiry ({expiryInfo.timeLeft}).
          </div>
        </div>
      )}

      {expiryInfo.isExpired && (
        <div className="detail-expiry-alert expired">
          <span>⌛</span>
          <div>
            <strong>Expired Listing:</strong> This food donation expired ({expiryInfo.timeLeft}).
          </div>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'flex-start', gap: '1.5rem' }}>
        {/* Left: General info */}
        <div className="detail-header">
          {donation.image?.url ? (
            <img src={donation.image.url} alt={donation.foodName} className="detail-img" />
          ) : (
            <div className="detail-img-placeholder">🍛</div>
          )}
          <div className="detail-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Listing Information</h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <StatusBadge status={donation.status} />
                <ExpiryBadge expiryDate={donation.expiryDate} />
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-field"><label>Category</label><p>📂 {donation.category}</p></div>
              <div className="detail-field"><label>Quantity</label><p>⚖️ {donation.quantity}</p></div>
              <div className="detail-field"><label>Prepared At</label><p>{formatDateTime(donation.preparationDate)}</p></div>
              <div className="detail-field"><label>Expiry Time</label><p>{formatDateTime(donation.expiryDate)}</p></div>
              <div className="detail-field" style={{ gridColumn: '1/-1' }}>
                <label>Expiry Countdown & Status</label>
                <div style={{ marginTop: '0.25rem' }}>
                  <ExpiryBadge expiryDate={donation.expiryDate} showTime={true} />
                </div>
              </div>
              <div className="detail-field" style={{ gridColumn: '1/-1' }}><label>Pickup Address</label><p>📍 {donation.pickupAddress}</p></div>
              {donation.description && (
                <div className="detail-field" style={{ gridColumn: '1/-1' }}><label>Description</label><p>{donation.description}</p></div>
              )}
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="detail-field">
                <label>Donor Details</label>
                <p>👤 <strong>{donation.donorId?.name}</strong></p>
                <p>📞 Phone: {donation.donorId?.phone}</p>
                <p>✉️ Email: {donation.donorId?.email}</p>
              </div>

              {donation.acceptedBy && (
                <div className="detail-field">
                  <label>NGO Details</label>
                  <p>🏢 <strong>{donation.acceptedBy.name}</strong></p>
                  <p>📞 Phone: {donation.acceptedBy.phone}</p>
                  <p>✉️ Email: {donation.acceptedBy.email}</p>
                </div>
              )}

              {donation.volunteerId && (
                <div className="detail-field">
                  <label>Volunteer Details</label>
                  <p>🚴 <strong>{donation.volunteerId.name}</strong></p>
                  <p>📞 Phone: {donation.volunteerId.phone}</p>
                  <p>✉️ Email: {donation.volunteerId.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Moderation controls */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Moderation & Logs</h3>
          <p className="text-muted text-sm mb-2">As an admin, you can moderate inappropriate donations or cancel ongoing logistics if they do not meet food safety standards.</p>

          {!['Cancelled', 'Completed', 'Delivered'].includes(donation.status) ? (
            <button
              onClick={handleCancel}
              className="btn btn-danger btn-block btn-lg"
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : '🚨 Flag & Cancel Donation'}
            </button>
          ) : donation.status === 'Cancelled' ? (
            <div className="alert alert-error" style={{ margin: 0 }}>
              ⚠️ This listing has been Cancelled/Flagged.
            </div>
          ) : (
            <div className="alert alert-success" style={{ margin: 0 }}>
              ✓ Donation has been completed and delivered safely. No further audit action needed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDonationDetails;
