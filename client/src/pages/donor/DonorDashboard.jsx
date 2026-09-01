import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/donations/my')
      .then(res => setDonations(res.data.donations))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: donations.length,
    available: donations.filter(d => d.status === 'Available').length,
    active: donations.filter(d => !['Completed', 'Cancelled', 'Available'].includes(d.status)).length,
    completed: donations.filter(d => d.status === 'Completed').length,
    cancelled: donations.filter(d => d.status === 'Cancelled').length,
  };

  const recent = donations.slice(0, 5);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">Here's an overview of your food donation activity.</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard icon="📋" value={stats.total}     label="Total Donations"    colorClass="blue" />
        <StatCard icon="🟢" value={stats.available} label="Available"          colorClass="green" />
        <StatCard icon="🚴" value={stats.active}    label="In Progress"        colorClass="orange" />
        <StatCard icon="🎉" value={stats.completed} label="Completed"          colorClass="teal" />
      </div>

      {/* Quick Action */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Have surplus food?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Post it now and help someone in need.</p>
        </div>
        <Link to="/donor/add-donation" className="btn btn-primary">➕ Add Donation</Link>
      </div>

      {/* Recent Donations */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Recent Donations</h2>
          <Link to="/donor/my-donations" className="btn btn-secondary btn-sm">View All</Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <div className="empty-state-title">No donations yet</div>
            <div className="empty-state-desc">Post your first surplus food donation to get started.</div>
            <Link to="/donor/add-donation" className="btn btn-primary">Add Your First Donation</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Food Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(d => (
                  <tr key={d._id}>
                    <td><strong>{d.foodName}</strong></td>
                    <td>{d.category}</td>
                    <td>{d.quantity}</td>
                    <td>{formatDate(d.expiryDate)}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td><Link to={`/donor/donations/${d._id}`} className="btn btn-secondary btn-sm">View</Link></td>
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

export default DonorDashboard;
