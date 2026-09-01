import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/donations')
    ])
      .then(([statsRes, donRes]) => {
        setStats(statsRes.data.stats);
        setRecentDonations(donRes.data.donations.slice(0, 5));
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Monitor and oversee the surplus food redistribution ecosystem.</p>
      </div>

      {stats && (
        <>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.875rem' }}>Ecosystem Members</h3>
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            <StatCard icon="👥" value={stats.totalUsers}       label="Ecosystem Users"    colorClass="blue" />
            <StatCard icon="🍽️" value={stats.totalDonors}      label="Active Donors"      colorClass="orange" />
            <StatCard icon="🏢" value={stats.totalNGOs}        label="NGO Partners"       colorClass="teal" />
            <StatCard icon="🚴" value={stats.totalVolunteers}  label="Delivery Volunteers" colorClass="purple" />
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.875rem' }}>Donation Logistics</h3>
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            <StatCard icon="📋" value={stats.totalDonations}     label="Total Donations"     colorClass="blue" />
            <StatCard icon="🟢" value={stats.availableDonations} label="Available Foods"     colorClass="green" />
            <StatCard icon="🎉" value={stats.completedDonations} label="Completed Deliveries" colorClass="green" />
            <StatCard icon="❌" value={stats.cancelledDonations} label="Cancelled/Inappropriate" colorClass="red" />
          </div>
        </>
      )}

      {/* Navigation Quicklinks */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justify: 'space-between', gap: '1rem' }}>
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>User Management</h4>
            <p className="text-muted text-sm">Review, verify, and deactivate/activate donor, NGO, and volunteer profiles.</p>
          </div>
          <Link to="/admin/users" className="btn btn-secondary btn-sm">Manage Users</Link>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justify: 'space-between', gap: '1rem' }}>
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Donation Management</h4>
            <p className="text-muted text-sm">Review and moderate all food listings. Cancel inappropriate content.</p>
          </div>
          <Link to="/admin/donations" className="btn btn-secondary btn-sm">Manage Food</Link>
        </div>
      </div>

      {/* Recent Donations Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Recent Platform Activity</h2>
          <Link to="/admin/donations" className="btn btn-secondary btn-sm">View All Listings</Link>
        </div>

        {recentDonations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No donations logged yet</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Donor</th>
                  <th>NGO</th>
                  <th>Volunteer</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.map(d => (
                  <tr key={d._id}>
                    <td><strong>{d.foodName}</strong></td>
                    <td>{d.donorId?.name}</td>
                    <td>{d.acceptedBy?.name || <span className="text-muted">—</span>}</td>
                    <td>{d.volunteerId?.name || <span className="text-muted">—</span>}</td>
                    <td>{formatDate(d.expiryDate)}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <Link to={`/admin/donations/${d._id}`} className="btn btn-secondary btn-sm">View</Link>
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

export default AdminDashboard;
