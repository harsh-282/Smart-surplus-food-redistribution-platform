import { useState } from 'react';
import api from '../../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const ProofOfDeliveryForm = ({ donation, onSuccess }) => {
  const [receiverName, setReceiverName] = useState('');
  const [notes, setNotes] = useState('Food delivered successfully in good condition.');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    setErrorMsg('');
    const file = e.target.files[0];
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview('');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMsg('Invalid file type. Please select a JPG, JPEG, PNG, or WEBP image.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller image.`);
      e.target.value = '';
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      if (receiverName.trim()) formData.append('receiverName', receiverName.trim());
      if (notes.trim()) formData.append('notes', notes.trim());
      if (photoFile) formData.append('deliveryPhoto', photoFile);

      const res = await api.post(`/pod/${donation._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        if (onSuccess) onSuccess(res.data.proofOfDelivery);
      }
    } catch (err) {
      console.error('POD submit error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit Proof of Delivery. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!donation) return null;

  return (
    <div className="card" style={{ border: '2px solid var(--primary-glow, rgba(34, 197, 94, 0.3))' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📦 Create Digital Proof of Delivery (POD)
          </h3>
          <p className="text-muted text-sm" style={{ marginTop: '0.2rem', marginBottom: 0 }}>
            Confirm food delivery to NGO with optional photo verification and notes
          </p>
        </div>
        <span className="badge badge-warning" style={{ fontWeight: 700 }}>
          Delivery Confirmation Required
        </span>
      </div>

      {errorMsg && (
        <div className="alert alert-error mb-3" style={{ fontSize: '0.875rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Read-Only Summary Box */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span className="text-muted">Donation:</span> <strong>{donation.foodName}</strong> ({donation.quantity})
            </div>
            <div>
              <span className="text-muted">Recipient NGO:</span> <strong>{donation.acceptedBy?.name || 'NGO'}</strong>
            </div>
            <div>
              <span className="text-muted">Current Status:</span> <strong>{donation.status}</strong>
            </div>
            <div>
              <span className="text-muted">Delivery Timestamp:</span> <strong>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
          </div>
        </div>

        {/* Receiver Name */}
        <div className="form-group mb-3">
          <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            👤 Receiver Name / NGO Representative <span className="text-muted">(Optional)</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. John Doe (Kitchen In-Charge)"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* Delivery Notes */}
        <div className="form-group mb-3">
          <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            📝 Delivery Notes <span className="text-muted">(Optional)</span>
          </label>
          <textarea
            className="form-control"
            rows="2"
            placeholder="Add any relevant delivery observations or quality check notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            maxLength={500}
          />
        </div>

        {/* Photo Upload Section */}
        <div className="form-group mb-3">
          <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>
            📸 Delivery Confirmation Photo <span className="text-muted">(Optional - JPG, PNG, WEBP &lt; 5MB)</span>
          </label>

          {photoPreview ? (
            <div style={{ position: 'relative', display: 'inline-block', marginTop: '0.5rem' }}>
              <img
                src={photoPreview}
                alt="Delivery Preview"
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="btn btn-secondary btn-sm"
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none' }}
                disabled={submitting}
              >
                ✕ Remove Image
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="form-control"
              onChange={handleFileChange}
              disabled={submitting}
            />
          )}
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '1.25rem' }}>
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting}
            style={{ fontWeight: 700 }}
          >
            {submitting ? 'Uploading Photo & Submitting POD...' : '🚀 Submit Digital Proof of Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProofOfDeliveryForm;
