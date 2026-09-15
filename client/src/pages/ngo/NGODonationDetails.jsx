import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import { getExpiryInfo } from '../../utils/expiryHelper';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const NGODonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/donations/${id}`),
      api.get('/volunteer/available')
    ])
      .then(([donRes, volRes]) => {
        setDonation(donRes.data.donation);
        setVolunteers(volRes.data.volunteers);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async () => {
    if (!window.confirm('Accept this donation?')) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put(`/donations/${id}/accept`);
      setDonation(res.data.donation);
      setSuccessMsg('🎉 Donation accepted successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to accept donation.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVolunteer = async (e) => {
    e.preventDefault();
    if (!selectedVolunteer) {
      setErrorMsg('Please select a volunteer to assign.');
      return;
    }
    setAssigning(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put(`/donations/${id}/assign-volunteer`, { volunteerId: selectedVolunteer });
      setDonation(res.data.donation);
      setSuccessMsg('🚴 Volunteer assigned successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to assign volunteer.');
    } finally {
      setAssigning(false);
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
      <button onClick={() => navigate(-1)} className="back-btn">← Back</button>

      <div className="page-header">
        <h1 className="page-title">{donation.foodName}</h1>
        <p className="page-subtitle">Redistribution detail, status updates, and logistics coordination.</p>
      </div>

      {expiryInfo.isExpiringSoon && donation.status === 'Available' && (
        <div className="detail-expiry-alert soon">
          <span>⚡</span>
          <div>
            <strong>High Priority:</strong> This food donation is expiring soon ({expiryInfo.timeLeft}). Please accept and coordinate delivery promptly.
          </div>
        </div>
      )}

      {expiryInfo.isExpired && donation.status === 'Available' && (
        <div className="detail-expiry-alert expired">
          <span>⌛</span>
          <div>
            <strong>Donation Expired:</strong> This food donation expired ({expiryInfo.timeLeft}) and can no longer be accepted.
          </div>
        </div>
      )}

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <div className="grid-2" style={{ alignItems: 'flex-start', gap: '1.5rem' }}>
        {/* Info Card */}
        <div className="detail-header">
          {donation.image?.url ? (
            <img src={donation.image.url} alt={donation.foodName} className="detail-img" />
          ) : (
            <div className="detail-img-placeholder">🍲</div>
          )}
          <div className="detail-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Donation Information</h2>
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
              <div className="detail-field" style={{ gridColumn: '1/-1' }}><label>Pickup Location</label><p>📍 {donation.pickupAddress}</p></div>
              {donation.description && (
                <div className="detail-field" style={{ gridColumn: '1/-1' }}><label>Description</label><p>{donation.description}</p></div>
              )}
            </div>

            <div className="divider" />

            <div className="detail-grid">
              <div className="detail-field" style={{ gridColumn: '1/-1' }}>
                <label>Donor Details</label>
                <p>👤 <strong>{donation.donorId?.name}</strong></p>
                <p>📞 Phone: {donation.donorId?.phone}</p>
                <p>✉️ Email: {donation.donorId?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Logistics Coordination</h3>

          {donation.status === 'Available' && (
            <div>
              {expiryInfo.isExpired ? (
                <div className="alert alert-error" style={{ margin: 0 }}>
                  ⚠️ This food donation has expired and cannot be accepted.
                </div>
              ) : (
                <>
                  <p className="text-muted mb-2">This donation is currently available. Accept it first to assign a volunteer.</p>
                  <button onClick={handleAccept} className="btn btn-primary btn-block">Accept Donation</button>
                </>
              )}
            </div>
          )}

          {donation.status === 'Accepted' && (
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Assign Delivery Volunteer</h4>
              {volunteers.length === 0 ? (
                <div className="alert alert-warning" style={{ margin: 0 }}>
                  ⚠️ No available volunteers active at the moment.
                </div>
              ) : (
                <form onSubmit={handleAssignVolunteer}>
                  <div className="form-group">
                    <label className="form-label">Select Volunteer</label>
                    <select
                      className="form-control"
                      value={selectedVolunteer}
                      onChange={e => setSelectedVolunteer(e.target.value)}
                    >
                      <option value="">-- Choose Volunteer --</option>
                      {volunteers.map(v => (
                        <option key={v._id} value={v.userId?._id}>
                          🚴 {v.userId?.name} ({v.vehicleType || 'Motorcycle'} | completed: {v.completedDeliveries})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={assigning}>
                    {assigning ? 'Assigning...' : 'Assign Volunteer'}
                  </button>
                </form>
              )}
            </div>
          )}

          {['Pickup Assigned', 'Picked Up', 'Delivered', 'Completed'].includes(donation.status) && (
            <div>
              <div className="detail-field mb-2">
                <label>Assigned Volunteer</label>
                <p style={{ fontSize: '1rem', marginTop: '0.25rem' }}>🚴 <strong>{donation.volunteerId?.name || 'Assigned'}</strong></p>
                {donation.volunteerId?.phone && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📞 Phone: {donation.volunteerId.phone}</p>}
                {donation.volunteerId?.email && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>✉️ Email: {donation.volunteerId.email}</p>}
              </div>
              <div className="alert alert-info" style={{ margin: 0 }}>
                💡 Volunteer is currently coordinating pickup and delivery. Tracking status is: <strong>{donation.status}</strong>.
              </div>
            </div>
          )}

          {donation.status === 'Cancelled' && (
            <div className="alert alert-error" style={{ margin: 0 }}>
              ❌ This donation was cancelled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NGODonationDetails;
