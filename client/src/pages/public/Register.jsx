import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roles = [
  { value: 'donor',     icon: '🍽️', label: 'Donor',     desc: 'Post surplus food' },
  { value: 'ngo',       icon: '🏢', label: 'NGO',       desc: 'Accept donations' },
  { value: 'volunteer', icon: '🚴', label: 'Volunteer', desc: 'Handle deliveries' },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
        <div className="auth-logo"><span style={{ fontSize: '2.5rem' }}>🌿</span></div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join FoodShare and make a difference</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* Role Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">I want to join as</label>
          <div className="role-selector">
            {roles.map((r) => (
              <label key={r.value} className={`role-option${selectedRole === r.value ? ' selected' : ''}`}>
                <input type="radio" name="role" value={r.value} checked={selectedRole === r.value} onChange={() => setSelectedRole(r.value)} />
                <div className="role-icon">{r.icon}</div>
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
              <input type="text" name="name" className="form-control" placeholder="Your name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone *</label>
              <input type="tel" name="phone" className="form-control" placeholder="9876543210" value={form.phone} onChange={handleChange} required />
            </div>
          </div>

          {selectedRole === 'ngo' && (
            <div className="grid-2" style={{ gap: '0.875rem', marginTop: '0.875rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Organization Name *</label>
                <input type="text" name="organizationName" className="form-control" placeholder="NGO Name" value={form.organizationName} onChange={handleChange} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contact Person</label>
                <input type="text" name="contactPerson" className="form-control" placeholder="Contact name" value={form.contactPerson} onChange={handleChange} />
              </div>
            </div>
          )}

          <div className="form-group mt-2">
            <label className="form-label">Email Address *</label>
            <input type="email" name="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input type="text" name="address" className="form-control" placeholder="Your address" value={form.address} onChange={handleChange} />
          </div>

          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <input type="password" name="password" className="form-control" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm Password *</label>
              <input type="password" name="confirmPassword" className="form-control" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required />
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
