import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import PriorityExplanationCard from '../../components/common/PriorityExplanationCard';
import DonationTimeline from '../../components/common/DonationTimeline';
import ProofOfDeliveryCard from '../../components/common/ProofOfDeliveryCard';
import QRDonationBadge from '../../components/common/QRDonationBadge';
import OTPGeneratorCard from '../../components/common/OTPGeneratorCard';
import { getExpiryInfo } from '../../utils/expiryHelper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FeedbackSection from '../../components/common/FeedbackSection';
import GoogleMapView from '../../components/common/GoogleMapView';
import LiveTrackerControls from '../../components/common/LiveTrackerControls';

const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);

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

  const expiryInfo = getExpiryInfo(donation.expiryDate);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="back-btn">← Back to My Donations</button>

      {/* Donor Priority Status Indicator */}
      <PriorityExplanationCard donation={donation} isDonorView={true} />

      {expiryInfo.isExpiringSoon && (
        <div className="detail-expiry-alert soon">
          <span>⚡</span>
          <div>
            <strong>Expiring Soon Warning:</strong> This food donation is within 24 hours of expiry ({expiryInfo.timeLeft}).
          </div>
        </div>
      )}

      {expiryInfo.isExpired && (
        <div className="detail-expiry-alert expired">
          <span>⌛</span>
          <div>
            <strong>Food Expired:</strong> This donation expired ({expiryInfo.timeLeft}). It is kept in your donation history.
          </div>
        </div>
      )}

      {/* Pickup Handover OTP Generator for Donor */}
      {['Accepted', 'Pickup Assigned', 'Picked Up', 'Delivered', 'Completed'].includes(donation.status) && (
        <div style={{ marginBottom: '1.5rem' }}>
          <OTPGeneratorCard
            donation={donation}
            type="pickup"
            onOtpStatusChange={() => {
              api.get(`/donations/${id}`).then(res => setDonation(res.data.donation)).catch(console.error);
            }}
          />
        </div>
      )}

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
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <QRDonationBadge donation={donation} />
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

        {/* Right: Donation Journey Tracker */}
        <div>
          <DonationTimeline donation={donation} currentRole="Donor" />
        </div>
      </div>

      {/* Digital Proof of Delivery Card for Donor */}
      {['Delivered', 'Completed'].includes(donation.status) && (
        <div style={{ marginTop: '1.5rem' }}>
          <ProofOfDeliveryCard donation={donation} currentRole="Donor" />
        </div>
      )}

      {/* Live Delivery Tracking Map */}
      {['Pickup Assigned', 'Picked Up', 'Delivered', 'Completed'].includes(donation.status) && (
        <>
          <LiveTrackerControls
            donationId={donation._id}
            donationStatus={donation.status}
            isVolunteer={false}
            onTrackingChange={setTrackingInfo}
          />
          <GoogleMapView
            pickupAddress={donation.pickupAddress || donation.donorId?.address}
            pickupCoords={donation.pickupCoordinates || donation.donorId?.locationCoordinates}
            destinationAddress={donation.acceptedBy?.address}
            destinationCoords={donation.acceptedBy?.locationCoordinates}
            volunteerCoords={trackingInfo?.location}
            trackingActive={Boolean(trackingInfo?.trackingActive)}
            isStale={Boolean(trackingInfo?.isStale)}
            lastUpdatedAt={trackingInfo?.lastUpdatedAt}
          />
        </>
      )}

      {/* Ratings & Community Feedback */}
      <FeedbackSection donation={donation} />
    </div>
  );
};

export default DonationDetails;
