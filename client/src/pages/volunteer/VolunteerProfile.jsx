import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const VolunteerProfile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: '', phone: '', address: '',
    vehicleType: 'Motorcycle', availability: 'Available', completedDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const VEHICLE_TYPES = ['Bicycle', 'Motorcycle', 'Car', 'Van', 'On Foot', 'Other'];
  const AVAILABILITIES = ['Available', 'Busy', 'Offline'];

  useEffect(() => {
    api.get('/volunteer/profile')
      .then(res => {
        const p = res.data.profile;
        setForm({
          name: user?.name || '',
          phone: user?.phone || '',
          address: user?.address || '',
          vehicleType: p?.vehicleType || 'Motorcycle',
          availability: p?.availability || 'Available',
          completedDeliveries: p?.completedDeliveries || 0,
        });
      })
      .catch(err => {
        console.error(err);
        setForm({
          name: user?.name || '',
          phone: user?.phone || '',
          address: user?.address || '',
          vehicleType: 'Motorcycle',
          availability: 'Available',
          completedDeliveries: 0,
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // 1. Update volunteer profile details
      await api.put('/volunteer/profile', {
        phone: form.phone,
        address: form.address,
        vehicleType: form.vehicleType,
        availability: form.availability,
      });

      // 2. Update user core details
      const userRes = await api.put('/auth/me', {
        name: form.name,
        phone: form.phone,
        address: form.address,
      });

      updateUser(userRes.data.user);
      setSuccess('✅ Profile and volunteer settings updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Volunteer Profile</h1>
        <p className="page-subtitle">Configure your status, vehicle details, and personal contact info.</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start', gap: '1.5rem' }}>
        {/* Volunteer Info Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--status-assigned), #6b21a8)',
            display: 'flex', alignItems: 'center', justify: 'center', fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 auto 1rem'
          }}>
            {getInitials(form.name)}
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.35rem' }}>{form.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <span className={`badge ${form.availability === 'Available' ? 'badge-available' : 'badge-cancelled'}`}>
              Availability: {form.availability}
            </span>
            <span className="badge badge-volunteer">🚴 Volunteer</span>
          </div>
          <div className="divider" />
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>VEHICLE</div><div style={{ fontSize: '0.9rem' }}>{form.vehicleType}</div></div>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>COMPLETED DELIVERIES</div><div style={{ fontSize: '0.9rem' }}>{form.completedDeliveries} deliveries</div></div>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>CONTACT PHONE</div><div style={{ fontSize: '0.9rem' }}>{form.phone}</div></div>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>ADDRESS</div><div style={{ fontSize: '0.9rem' }}>{form.address || 'Not set'}</div></div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Edit Volunteer Settings</h3>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Availability Status</label>
                <select
                  className="form-control"
                  value={form.availability}
                  onChange={e => setForm({ ...form, availability: e.target.value })}
                >
                  {AVAILABILITIES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  className="form-control"
                  value={form.vehicleType}
                  onChange={e => setForm({ ...form, vehicleType: e.target.value })}
                >
                  {VEHICLE_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner-sm" /> Saving...</> : '💾 Save Volunteer Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;
