import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const DeliveryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get(`/donations/${id}`)
      .then(res => setDonation(res.data.donation))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async (nextStatus) => {
    if (!window.confirm(`Are you sure you want to update the status to "${nextStatus}"?`)) return;
    setUpdating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put(`/donations/${id}/status`, { status: nextStatus });
      setDonation(res.data.donation);
      setSuccessMsg(`🎉 Delivery status successfully updated to ${nextStatus}!`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!donation) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-title">Delivery task not found</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">Back</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="back-btn">← Back to Deliveries</button>

      <div className="page-header">
        <h1 className="page-title">Delivery details</h1>
        <p className="page-subtitle">Track pickup instructions, contact details, and update status.</p>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <div className="grid-2" style={{ alignItems: 'flex-start', gap: '1.5rem' }}>
        {/* Donation Details Card */}
        <div className="detail-header">
          {donation.image?.url ? (
            <img src={donation.image.url} alt={donation.foodName} className="detail-img" />
          ) : (
            <div className="detail-img-placeholder">🍛</div>
          )}
          <div className="detail-body">
            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Food Donation</h2>
              <StatusBadge status={donation.status} />
            </div>

            <div className="detail-grid">
              <div className="detail-field"><label>Category</label><p>📂 {donation.category}</p></div>
              <div className="detail-field"><label>Quantity</label><p>⚖️ {donation.quantity}</p></div>
              <div className="detail-field"><label>Prepared At</label><p>{formatDateTime(donation.preparationDate)}</p></div>
              <div className="detail-field"><label>Expiry Time</label><p>{formatDateTime(donation.expiryDate)}</p></div>
              <div className="detail-field" style={{ gridColumn: '1/-1' }}><label>Pickup Address</label><p>📍 <strong>{donation.pickupAddress}</strong></p></div>
              {donation.description && (
                <div className="detail-field" style={{ gridColumn: '1/-1' }}><label>Description</label><p>{donation.description}</p></div>
              )}
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="detail-field">
                <label>Donor (Pickup Location)</label>
                <p>👤 <strong>{donation.donorId?.name}</strong></p>
                <p>📞 Phone: <a href={`tel:${donation.donorId?.phone}`}>{donation.donorId?.phone}</a></p>
                <p>📍 Address: {donation.donorId?.address || donation.pickupAddress}</p>
              </div>

              <div className="detail-field">
                <label>NGO (Destination Location)</label>
                <p>🏢 <strong>{donation.acceptedBy?.name}</strong></p>
                <p>📞 Phone: <a href={`tel:${donation.acceptedBy?.phone}`}>{donation.acceptedBy?.phone}</a></p>
              </div>
            </div>
          </div>
        </div>

        {/* Update Status Actions Card */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Status Actions</h3>

          {donation.status === 'Pickup Assigned' && (
            <div>
              <p className="text-muted mb-2">You have been assigned to pick up this food. Once you reach the donor location and receive the food, click below.</p>
              <button
                onClick={() => handleUpdateStatus('Picked Up')}
                className="btn btn-primary btn-block btn-lg"
                disabled={updating}
              >
                {updating ? 'Updating...' : '📦 Mark as Picked Up'}
              </button>
            </div>
          )}

          {donation.status === 'Picked Up' && (
            <div>
              <p className="text-muted mb-2">You have picked up the food. Once you reach the NGO location and safely deliver the food, click below.</p>
              <button
                onClick={() => handleUpdateStatus('Delivered')}
                className="btn btn-orange btn-block btn-lg"
                disabled={updating}
              >
                {updating ? 'Updating...' : '🚚 Mark as Delivered'}
              </button>
            </div>
          )}

          {donation.status === 'Delivered' && (
            <div>
              <p className="text-muted mb-2">Food has been successfully delivered. Please mark the redistribution loop completed to finish the task.</p>
              <button
                onClick={() => handleUpdateStatus('Completed')}
                className="btn btn-primary btn-block btn-lg"
                disabled={updating}
              >
                {updating ? 'Updating...' : '🎉 Mark as Completed'}
              </button>
            </div>
          )}

          {donation.status === 'Completed' && (
            <div className="alert alert-success" style={{ margin: 0 }}>
              🎉 This redistribution delivery has been completed successfully! Good job!
            </div>
          )}

          {donation.status === 'Cancelled' && (
            <div className="alert alert-error" style={{ margin: 0 }}>
              ❌ This donation task was cancelled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetails;
