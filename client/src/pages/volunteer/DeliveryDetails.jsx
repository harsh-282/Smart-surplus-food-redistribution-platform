import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FeedbackSection from '../../components/common/FeedbackSection';
import RouteDistanceCard from '../../components/common/RouteDistanceCard';
import DonationTimeline from '../../components/common/DonationTimeline';
import ProofOfDeliveryForm from '../../components/common/ProofOfDeliveryForm';
import ProofOfDeliveryCard from '../../components/common/ProofOfDeliveryCard';
import QRDonationBadge from '../../components/common/QRDonationBadge';
import OTPVerificationCard from '../../components/common/OTPVerificationCard';
import GoogleMapView from '../../components/common/GoogleMapView';
import LiveTrackerControls from '../../components/common/LiveTrackerControls';

const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const DeliveryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [trackingInfo, setTrackingInfo] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/donations/${id}`),
      api.get(`/pod/${id}`).catch(() => ({ data: null })),
    ])
      .then(([donRes, podRes]) => {
        setDonation(donRes.data.donation);
        if (podRes?.data?.proofOfDelivery) {
          setPod(podRes.data.proofOfDelivery);
        }
      })
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

  const handlePodCreated = (newPod) => {
    setPod(newPod);
    setSuccessMsg('🎉 Digital Proof of Delivery created successfully!');
    // Refresh donation status
    api.get(`/donations/${id}`).then(res => setDonation(res.data.donation)).catch(console.error);
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
        <p className="page-subtitle">Track pickup instructions, contact details, update status, and submit proof of delivery.</p>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Food Donation</h2>
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
                <p>📍 Address: {donation.acceptedBy?.address || 'NGO address not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Update Status Actions Card */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Handover & Status Actions</h3>

          {/* Pickup Handover OTP Verification Card */}
          {['Pickup Assigned', 'Accepted'].includes(donation.status) && (
            <div style={{ marginBottom: '1.25rem' }}>
              <OTPVerificationCard
                donation={donation}
                type="pickup"
                onVerified={(updatedDonation) => setDonation(updatedDonation)}
              />
            </div>
          )}

          {/* Delivery Handover OTP Verification Card */}
          {donation.status === 'Picked Up' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <OTPVerificationCard
                donation={donation}
                type="delivery"
                onVerified={(updatedDonation) => setDonation(updatedDonation)}
              />
            </div>
          )}

          {pod ? (
            <div className="alert alert-success" style={{ margin: 0 }}>
              ✓ Proof of Delivery submitted for this donation ({pod.podId}). Status: <strong>{pod.status}</strong>.
            </div>
          ) : donation.status === 'Completed' ? (
            <div className="alert alert-success" style={{ margin: 0 }}>
              🎉 This redistribution delivery has been completed successfully! Good job!
            </div>
          ) : donation.status === 'Cancelled' ? (
            <div className="alert alert-error" style={{ margin: 0 }}>
              ❌ This donation task was cancelled.
            </div>
          ) : null}
        </div>
      </div>

      {/* Digital Proof of Delivery Form (if in Picked Up or Delivered state and POD not submitted) */}
      {['Picked Up', 'Delivered'].includes(donation.status) && !pod && (
        <div style={{ marginTop: '1.5rem' }}>
          <ProofOfDeliveryForm donation={donation} onSuccess={handlePodCreated} />
        </div>
      )}

      {/* Digital Proof of Delivery Display Card (if POD exists) */}
      {pod && (
        <div style={{ marginTop: '1.5rem' }}>
          <ProofOfDeliveryCard donation={donation} initialPod={pod} currentRole="Volunteer" />
        </div>
      )}

      {/* Donation Journey Tracker */}
      <div style={{ marginTop: '1.5rem' }}>
        <DonationTimeline donation={donation} currentRole="Volunteer" />
      </div>

      {/* Live GPS Tracking Controls for Volunteer */}
      <LiveTrackerControls
        donationId={donation._id}
        donationStatus={donation.status}
        isVolunteer={true}
        onTrackingChange={setTrackingInfo}
      />

      {/* Google Maps View with Live Volunteer Marker */}
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

      {/* Route, Distance & Navigation Options */}
      <RouteDistanceCard
        pickupAddress={donation.pickupAddress || donation.donorId?.address}
        pickupCoords={donation.pickupCoordinates || donation.donorId?.locationCoordinates}
        destinationAddress={donation.acceptedBy?.address}
        destinationCoords={donation.acceptedBy?.locationCoordinates}
        donorName={donation.donorId?.name || 'Donor'}
        ngoName={donation.acceptedBy?.name || 'NGO'}
      />

      {/* Ratings & Feedback */}
      <FeedbackSection donation={donation} />
    </div>
  );
};

export default DeliveryDetails;
