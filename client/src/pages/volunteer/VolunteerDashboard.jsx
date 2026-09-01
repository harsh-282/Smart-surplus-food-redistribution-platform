import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/volunteer/deliveries'),
      api.get('/volunteer/profile')
    ])
      .then(([delRes, profRes]) => {
        setDeliveries(delRes.data.deliveries);
        setProfile(profRes.data.profile);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: deliveries.length,
    assigned: deliveries.filter(d => d.status === 'Pickup Assigned').length,
    pickedUp: deliveries.filter(d => d.status === 'Picked Up').length,
    delivered: deliveries.filter(d => d.status === 'Delivered').length,
    completed: profile?.completedDeliveries || deliveries.filter(d => d.status === 'Completed').length,
  };

  const pendingDeliveries = deliveries.filter(d => ['Pickup Assigned', 'Picked Up', 'Delivered'].includes(d.status));

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 🚴</h1>
        <p className="page-subtitle">Manage your assigned pickups and update donation delivery progress.</p>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard icon="📋" value={stats.total}     label="Total Tasks"        colorClass="blue" />
        <StatCard icon="🚴" value={stats.assigned}  label="Pickup Assigned"    colorClass="orange" />
        <StatCard icon="📦" value={stats.pickedUp}  label="Picked Up"          colorClass="purple" />
        <StatCard icon="🎉" value={stats.completed} label="Total Completed"    colorClass="green" />
      </div>

      {/* Status banner */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Your Current Availability</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Status: <strong style={{ color: profile?.availability === 'Available' ? 'var(--green-400)' : 'var(--orange-400)' }}>{profile?.availability || 'Offline'}</strong>
          </p>
        </div>
        <Link to="/volunteer/profile" className="btn btn-secondary btn-sm">Change Availability</Link>
      </div>

      {/* Pending Deliveries */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Active Deliveries ({pendingDeliveries.length})</h2>
          <Link to="/volunteer/deliveries" className="btn btn-secondary btn-sm">View All History</Link>
        </div>

        {pendingDeliveries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚴</div>
            <div className="empty-state-title">No active pickups</div>
            <div className="empty-state-desc">You don't have any pending delivery tasks. Make sure your profile availability is set to "Available".</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Food</th>
                  <th>NGO</th>
                  <th>Quantity</th>
                  <th>Pickup Address</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeliveries.map(d => (
                  <tr key={d._id}>
                    <td><strong>{d.foodName}</strong></td>
                    <td>{d.acceptedBy?.name}</td>
                    <td>{d.quantity}</td>
                    <td>{d.pickupAddress?.slice(0, 30)}{d.pickupAddress?.length > 30 ? '...' : ''}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <Link to={`/volunteer/deliveries/${d._id}`} className="btn btn-primary btn-sm">Update Status</Link>
                    </td>
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

export default VolunteerDashboard;
