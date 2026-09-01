import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
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
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}! 🏢</h1>
        <p className="page-subtitle">Manage your accepted food donations and track distribution.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard icon="🌿" value={stats.available}  label="Available to Accept" colorClass="green" />
        <StatCard icon="✅" value={stats.accepted}   label="Accepted"             colorClass="blue" />
        <StatCard icon="🚴" value={stats.inProgress} label="In Progress"          colorClass="orange" />
        <StatCard icon="🎉" value={stats.completed}  label="Completed"            colorClass="teal" />
      </div>

      {/* Quick Action */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Browse Available Donations</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{stats.available} donations currently available for acceptance.</p>
        </div>
        <Link to="/ngo/available" className="btn btn-primary">🌿 View Available</Link>
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
