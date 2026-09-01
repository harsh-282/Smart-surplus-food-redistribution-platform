import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const NGOProfile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: '', phone: '', address: '',
    organizationName: '', contactPerson: '', description: '', registrationNumber: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch detailed NGO Profile
    api.get('/ngo/profile')
      .then(res => {
        const p = res.data.profile;
        setForm({
          name: user?.name || '',
          phone: user?.phone || '',
          address: user?.address || '',
          organizationName: p?.organizationName || '',
          contactPerson: p?.contactPerson || '',
          description: p?.description || '',
          registrationNumber: p?.registrationNumber || '',
        });
      })
      .catch(err => {
        console.error(err);
        // Fail-safe init if profile API failed or wasn't created yet
        setForm({
          name: user?.name || '',
          phone: user?.phone || '',
          address: user?.address || '',
          organizationName: user?.name || '',
          contactPerson: user?.name || '',
          description: '',
          registrationNumber: '',
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
      // 1. Update NGO profile
      const ngoRes = await api.put('/ngo/profile', {
        organizationName: form.organizationName,
        contactPerson: form.contactPerson,
        phone: form.phone,
        address: form.address,
        description: form.description,
        registrationNumber: form.registrationNumber,
      });

      // 2. Update core user details
      const userRes = await api.put('/auth/me', {
        name: form.name,
        phone: form.phone,
        address: form.address,
      });

      updateUser(userRes.data.user);
      setSuccess('✅ Profile and Organization details updated successfully!');
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
        <h1 className="page-title">NGO Profile</h1>
        <p className="page-subtitle">Manage organization registration, contact details, and platform information.</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start', gap: '1.5rem' }}>
        {/* NGO Info Summary */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--status-accepted), #2563eb)',
            display: 'flex', alignItems: 'center', justify: 'center', fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 auto 1rem'
          }}>
            {getInitials(form.organizationName)}
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.35rem' }}>{form.organizationName || 'NGO Name'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Registration: {form.registrationNumber || 'Not set'}</p>
          <span className="badge badge-ngo">🏢 NGO Partner</span>
          <div className="divider" />
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>CONTACT PERSON</div><div style={{ fontSize: '0.9rem' }}>{form.contactPerson || 'Not set'}</div></div>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>PHONE</div><div style={{ fontSize: '0.9rem' }}>{form.phone || 'Not set'}</div></div>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>EMAIL</div><div style={{ fontSize: '0.9rem' }}>{user?.email}</div></div>
            <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>OFFICE ADDRESS</div><div style={{ fontSize: '0.9rem' }}>{form.address || 'Not set'}</div></div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Edit Organization Details</h3>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Organization Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.organizationName}
                  onChange={e => setForm({ ...form, organizationName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. NGO-TN-2024"
                  value={form.registrationNumber}
                  onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Primary contact name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
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

            <div className="form-group">
              <label className="form-label">Organization Description</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="What community work does your organization perform?"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner-sm" /> Saving...</> : '💾 Save Organization Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NGOProfile;
