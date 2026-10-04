import { useState, useEffect } from 'react';
import api from '../../services/api';
import QRDonationBadge from './QRDonationBadge';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ProofOfDeliveryCard = ({ donation, initialPod = null, currentRole = '', onConfirmed }) => {
  const [pod, setPod] = useState(initialPod);
  const [loading, setLoading] = useState(!initialPod);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    if (initialPod) {
      setPod(initialPod);
      setLoading(false);
      return;
    }

    if (!donation?._id) return;

    setLoading(true);
    api.get(`/pod/${donation._id}`)
      .then((res) => {
        if (res.data.success) {
          setPod(res.data.proofOfDelivery);
        }
      })
      .catch((err) => {
        // Quietly fail if POD does not exist yet for this donation
        if (err.response?.status !== 404) {
          console.error('Error fetching POD:', err);
        }
      })
      .finally(() => setLoading(false));
  }, [donation?._id, initialPod]);

  const handleConfirmReceipt = async () => {
    if (!window.confirm('Confirm receipt of this food donation? This will complete the redistribution process.')) return;

    setConfirming(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.put(`/pod/${donation._id}/confirm`);
      if (res.data.success) {
        setPod(res.data.proofOfDelivery);
        setSuccessMsg('✅ Delivery receipt confirmed successfully! Redistribution marked as Completed.');
        if (onConfirmed) onConfirmed(res.data.donation);
      }
    } catch (err) {
      console.error('Confirm POD error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to confirm delivery receipt.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="card text-center" style={{ padding: '1.5rem' }}>
        <p className="text-muted" style={{ margin: 0 }}>⏳ Loading Digital Proof of Delivery...</p>
      </div>
    );
  }

  if (!pod) return null;

  const isConfirmed = pod.status === 'Confirmed' || pod.ngoConfirmed;

  return (
    <div className="card pod-card" style={{ border: isConfirmed ? '2px solid var(--green-500, #22c55e)' : '2px solid var(--orange-400, #f97316)' }}>
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📜 Digital Proof of Delivery (POD)
          </h3>
          <p className="text-muted text-sm" style={{ marginTop: '0.2rem', marginBottom: 0 }}>
            Official verified delivery record & audit receipt
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-secondary" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
            {pod.podId}
          </span>
          <span className={`badge ${isConfirmed ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
            {isConfirmed ? '✓ Delivery Confirmed' : '● Awaiting NGO Confirmation'}
          </span>
        </div>
      </div>

      {successMsg && <div className="alert alert-success mb-3">{successMsg}</div>}
      {errorMsg && <div className="alert alert-error mb-3">{errorMsg}</div>}

      {/* Details Grid */}
      <div className="detail-grid mb-3">
        <div className="detail-field">
          <label>POD Identifier</label>
          <p style={{ fontWeight: 700, fontFamily: 'monospace' }}>{pod.podId}</p>
        </div>
        <div className="detail-field">
          <label>QR Donation ID</label>
          <div style={{ marginTop: '0.2rem' }}>
            <QRDonationBadge donation={donation} />
          </div>
        </div>
        <div className="detail-field">
          <label>Delivered Date & Time</label>
          <p>🕒 {formatDateTime(pod.deliveredAt)}</p>
        </div>
        <div className="detail-field">
          <label>Delivery Volunteer</label>
          <p>🚴 <strong>{pod.volunteerId?.name || 'Assigned Volunteer'}</strong></p>
        </div>
        <div className="detail-field">
          <label>Receiving NGO & Representative</label>
          <p>🏢 <strong>{pod.ngoId?.name || donation?.acceptedBy?.name || 'NGO'}</strong></p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Receiver Name: <strong>{pod.receiverName || 'NGO Representative'}</strong>
          </p>
        </div>

        {pod.notes && (
          <div className="detail-field" style={{ gridColumn: '1/-1' }}>
            <label>Volunteer Delivery Notes</label>
            <p style={{ fontSize: '0.9rem', fontStyle: 'italic', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              "{pod.notes}"
            </p>
          </div>
        )}

        {isConfirmed && pod.ngoConfirmedAt && (
          <div className="detail-field" style={{ gridColumn: '1/-1' }}>
            <label>NGO Receipt Verification</label>
            <div style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: '0.875rem' }}>
              ✓ Receipt verified by {pod.ngoConfirmedBy?.name || pod.ngoId?.name || 'NGO'} on {formatDateTime(pod.ngoConfirmedAt)}
            </div>
          </div>
        )}
      </div>

      {/* Delivery Photo Section */}
      {pod.deliveryPhoto?.url && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
            📸 Delivery Confirmation Photo
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <img
              src={pod.deliveryPhoto.url}
              alt="Proof of Delivery Photo"
              onClick={() => setShowPhotoModal(true)}
              style={{
                width: '120px',
                height: '90px',
                objectFit: 'cover',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '2px solid var(--border-color)',
                transition: 'transform 0.2s',
              }}
              title="Click to expand view"
            />
            <div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowPhotoModal(true)}
              >
                🔍 View Full Photo
              </button>
              <p className="text-muted text-sm" style={{ marginTop: '0.25rem', marginBottom: 0 }}>
                Verified visual confirmation of food drop-off
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NGO Receipt Confirmation Action */}
      {(currentRole === 'NGO' || currentRole === 'Admin') && !isConfirmed && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="alert alert-info mb-3" style={{ fontSize: '0.875rem' }}>
            💡 The volunteer has submitted proof of delivery. Please review the details above and confirm receipt to finalize this food donation.
          </div>
          <button
            onClick={handleConfirmReceipt}
            className="btn btn-primary btn-block btn-lg"
            disabled={confirming}
            style={{ fontWeight: 700 }}
          >
            {confirming ? 'Confirming Receipt...' : '✅ Confirm Receipt & Complete Donation'}
          </button>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && pod.deliveryPhoto?.url && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: 'var(--bg-primary, #1e293b)',
              padding: '1rem',
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                📸 Proof of Delivery Photo ({pod.podId})
              </h4>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.2rem 0.6rem' }}
              >
                ✕ Close
              </button>
            </div>
            <img
              src={pod.deliveryPhoto.url}
              alt="Delivery Proof Full View"
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '8px', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProofOfDeliveryCard;
