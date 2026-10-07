import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  IconLeaf, IconAlertTriangle, IconUtensils, IconBuilding, IconBike,
  IconUser, IconPhone, IconMail, IconLock, IconMapPin
} from '../../components/common/Icons';

const roles = [
  { value: 'donor',     Icon: IconUtensils, label: 'Donor',     desc: 'Post surplus food',   color: 'var(--orange-400)', bg: 'rgba(249,115,22,0.1)' },
  { value: 'ngo',       Icon: IconBuilding, label: 'NGO',       desc: 'Accept donations',    color: '#3b82f6',           bg: 'rgba(59,130,246,0.1)' },
  { value: 'volunteer', Icon: IconBike,     label: 'Volunteer', desc: 'Handle deliveries',   color: '#a855f7',           bg: 'rgba(168,85,247,0.1)' },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('donor');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', address: '', organizationName: '', contactPerson: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, role: selectedRole, address: form.address,
      };
      if (selectedRole === 'ngo') {
        payload.organizationName = form.organizationName;
        payload.contactPerson = form.contactPerson;
      }
      const user = await register(payload);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '3rem 1.5rem' }}>
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <IconLeaf size={28} />
          </div>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join FoodShare and make a difference</p>

        {error && (
          <div className="alert alert-error">
            <IconAlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Role Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">I want to join as</label>
          <div className="role-selector">
            {roles.map((r) => (
              <label key={r.value} className={`role-option${selectedRole === r.value ? ' selected' : ''}`}>
                <input type="radio" name="role" value={r.value} checked={selectedRole === r.value} onChange={() => setSelectedRole(r.value)} />
                <div className="role-icon" style={{ color: selectedRole === r.value ? r.color : 'var(--text-secondary)' }}>
                  <r.Icon size={22} />
                </div>
                <div className="role-label">{r.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{r.desc}</div>
              </label>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <div className="input-icon-wrap">
                <span className="input-icon"><IconUser size={15} /></span>
                <input type="text" name="name" className="form-control input-with-icon" placeholder="Your name" value={form.name} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone *</label>
              <div className="input-icon-wrap">
                <span className="input-icon"><IconPhone size={15} /></span>
                <input type="tel" name="phone" className="form-control input-with-icon" placeholder="9876543210" value={form.phone} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {selectedRole === 'ngo' && (
            <div className="grid-2" style={{ gap: '0.875rem', marginTop: '0.875rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Organization Name *</label>
                <div className="input-icon-wrap">
                  <span className="input-icon"><IconBuilding size={15} /></span>
                  <input type="text" name="organizationName" className="form-control input-with-icon" placeholder="NGO Name" value={form.organizationName} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contact Person</label>
                <div className="input-icon-wrap">
                  <span className="input-icon"><IconUser size={15} /></span>
                  <input type="text" name="contactPerson" className="form-control input-with-icon" placeholder="Contact name" value={form.contactPerson} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          <div className="form-group mt-2">
            <label className="form-label">Email Address *</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><IconMail size={15} /></span>
              <input type="email" name="email" className="form-control input-with-icon" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <div className="input-icon-wrap">
              <span className="input-icon"><IconMapPin size={15} /></span>
              <input type="text" name="address" className="form-control input-with-icon" placeholder="Your address" value={form.address} onChange={handleChange} />
            </div>
          </div>

          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <div className="input-icon-wrap">
                <span className="input-icon"><IconLock size={15} /></span>
                <input type="password" name="password" className="form-control input-with-icon" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm Password *</label>
              <div className="input-icon-wrap">
                <span className="input-icon"><IconLock size={15} /></span>
                <input type="password" name="confirmPassword" className="form-control input-with-icon" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '1.5rem' }} disabled={loading}>
            {loading ? <><span className="spinner-sm" /> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--green-400)', fontWeight: 600 }}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
