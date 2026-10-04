import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import VerificationBadge from '../../components/common/VerificationBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

const NGODashboard = () => {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/ngo/donations'),
      api.get('/donations?status=Available'),
    ]).then(([accRes, avRes]) => {
      setAccepted(accRes.data.donations);
      setAvailable(avRes.data.donations);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = {
    available: available.length,
    accepted: accepted.filter(d => d.status === 'Accepted').length,
    inProgress: accepted.filter(d => ['Pickup Assigned', 'Picked Up', 'Delivered'].includes(d.status)).length,
    completed: accepted.filter(d => d.status === 'Completed').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}! 🏢</h1>
          <p className="page-subtitle">Manage your accepted food donations and track distribution.</p>
        </div>
        <div>
          <VerificationBadge status={user?.verificationStatus} role="ngo" size="md" />
        </div>
      </div>

      {user?.verificationStatus !== 'Verified' && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            borderRadius: '1rem',
            border: '1px solid',
            backgroundColor:
              user?.verificationStatus === 'Rejected'
                ? '#fef2f2'
                : user?.verificationStatus === 'Suspended'
                ? '#f3f4f6'
                : '#fffbeb',
            borderColor:
              user?.verificationStatus === 'Rejected'
                ? '#fca5a5'
                : user?.verificationStatus === 'Suspended'
                ? '#d1d5db'
                : '#fde68a',
            color:
              user?.verificationStatus === 'Rejected'
                ? '#991b1b'
                : user?.verificationStatus === 'Suspended'
                ? '#1f2937'
                : '#92400e',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user?.verificationStatus === 'Rejected' ? '⚠️ NGO Verification Not Approved' : user?.verificationStatus === 'Suspended' ? '🚫 Account Suspended' : '⏳ NGO Account Pending Verification'}
          </div>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            {user?.verificationStatus === 'Rejected'
              ? `Reason: "${user?.verificationRejectionReason || 'Profile information is incomplete.'}" Please update your NGO profile details and resubmit for review.`
              : user?.verificationStatus === 'Suspended'
              ? 'Your NGO account is currently suspended. You cannot claim new donations or perform receiving operations.'
              : 'Your NGO account is awaiting administrator review. You can browse food donations, but food claiming will be enabled once your account is verified.'}
          </p>
          {user?.verificationStatus === 'Rejected' && (
            <div style={{ marginTop: '0.75rem' }}>
              <Link to="/ngo/profile" className="btn btn-primary btn-sm">
                Update Profile & Resubmit
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard icon="🌿" value={stats.available}  label="Available to Accept" colorClass="green" />
        <StatCard icon="✅" value={stats.accepted}   label="Accepted"             colorClass="blue" />
        <StatCard icon="🚴" value={stats.inProgress} label="In Progress"          colorClass="orange" />
        <StatCard icon="🎉" value={stats.completed}  label="Completed"            colorClass="teal" />
      </div>

      {/* Quick Action Cards */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Browse Available Food</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{stats.available} active food items available to accept.</p>
          </div>
          <Link to="/ngo/available" className="btn btn-primary">🌿 View List</Link>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Interactive Nearby Map</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Visually discover surplus food locations around your NGO.</p>
          </div>
          <Link to="/ngo/nearby-donations" className="btn btn-primary">🗺️ Open Map</Link>
        </div>
      </div>

      {/* Recent Accepted */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Recently Accepted</h2>
          <Link to="/ngo/accepted" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        {accepted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">No accepted donations yet</div>
            <div className="empty-state-desc">Browse available donations and accept ones you can distribute.</div>
            <Link to="/ngo/available" className="btn btn-primary">Browse Donations</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Food</th><th>Donor</th><th>Quantity</th><th>Expiry</th><th>Volunteer</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {accepted.slice(0, 5).map(d => (
                  <tr key={d._id}>
                    <td><strong>{d.foodName}</strong></td>
                    <td>{d.donorId?.name}</td>
                    <td>{d.quantity}</td>
                    <td>{formatDate(d.expiryDate)}</td>
                    <td>{d.volunteerId?.name || <span style={{ color: 'var(--text-muted)' }}>Not assigned</span>}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td><Link to={`/ngo/donations/${d._id}`} className="btn btn-secondary btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGODashboard;
