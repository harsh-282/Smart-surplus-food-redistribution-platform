import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CATEGORIES = ['Cooked Food', 'Raw Vegetables', 'Fruits', 'Packaged Food', 'Bakery', 'Dairy', 'Beverages', 'Other'];

const toDatetimeLocal = (d) => {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

const AddDonation = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    foodName: '', category: 'Cooked Food', quantity: '',
    preparationDate: '', expiryDate: '', pickupAddress: '', description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.foodName || !form.quantity || !form.preparationDate || !form.expiryDate || !form.pickupAddress) {
      setError('Please fill all required fields.'); return;
    }
    if (new Date(form.expiryDate) <= new Date(form.preparationDate)) {
      setError('Expiry date must be after preparation date.'); return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (imageFile) data.append('image', imageFile);

      await api.post('/donations', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('🎉 Donation posted successfully! Redirecting...');
      setTimeout(() => navigate('/donor/my-donations'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post donation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">➕ Add Food Donation</h1>
        <p className="page-subtitle">Fill in the details about your surplus food. The image will be uploaded to Cloudinary.</p>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Food Image */}
          <div className="form-group">
            <label className="form-label">Food Photo (Uploaded to Cloudinary)</label>
            <div className="upload-area" onClick={() => fileRef.current?.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="upload-preview" />
              ) : (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📸</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Click to upload food photo</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>JPG, PNG, WebP up to 5MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </div>
            {imageFile && <p className="form-hint">✅ {imageFile.name} selected — will be uploaded to Cloudinary</p>}
          </div>

          {/* Food Name & Category */}
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Food Name *</label>
              <input type="text" name="foodName" className="form-control" placeholder="e.g. Chicken Biryani" value={form.foodName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select name="category" className="form-control" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input type="text" name="quantity" className="form-control" placeholder="e.g. 50 portions, 10 kg, 30 packets" value={form.quantity} onChange={handleChange} required />
          </div>

          {/* Dates */}
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Preparation Date & Time *</label>
              <input type="datetime-local" name="preparationDate" className="form-control" value={form.preparationDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date & Time *</label>
              <input type="datetime-local" name="expiryDate" className="form-control" value={form.expiryDate} onChange={handleChange} required />
            </div>
          </div>

          {/* Pickup Address */}
          <div className="form-group">
            <label className="form-label">Pickup Address *</label>
            <input type="text" name="pickupAddress" className="form-control" placeholder="Full address where food can be picked up" value={form.pickupAddress} onChange={handleChange} required />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-control" placeholder="Any additional details about the food (allergies, packaging, etc.)" value={form.description} onChange={handleChange} rows={3} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><span className="spinner-sm" /> Uploading & Posting...</> : '🌿 Post Donation'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/donor/my-donations')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDonation;
