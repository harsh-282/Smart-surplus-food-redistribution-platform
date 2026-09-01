import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin',     email: 'admin@foodshare.com',        pass: 'Admin@123' },
    { role: 'Donor',     email: 'anand.restaurant@gmail.com', pass: 'Donor@123' },
    { role: 'NGO',       email: 'helphands@gmail.com',        pass: 'NGO@123' },
    { role: 'Volunteer', email: 'arjun.volunteer@gmail.com',  pass: 'Vol@123' },
  ];

  const fillDemo = (email, pass) => setForm({ email, password: pass });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span style={{ fontSize: '2.5rem' }}>🌿</span>
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your FoodShare account</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-control" placeholder="••••••••" value={form.password} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <><span className="spinner-sm" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or use a demo account</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {demoAccounts.map((acc) => (
            <button
              key={acc.role}
              onClick={() => fillDemo(acc.email, acc.pass)}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
            >
              {acc.role === 'Admin' ? '👑' : acc.role === 'Donor' ? '🍽️' : acc.role === 'NGO' ? '🏢' : '🚴'} {acc.role}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--green-400)', fontWeight: 600 }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
