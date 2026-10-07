import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AnalyticsKpiCards from '../../components/admin/AnalyticsKpiCards';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import AdminFeedbackStats from '../../components/admin/AdminFeedbackStats';
import { IconShield, IconUsers, IconUtensils, IconList } from '../../components/common/Icons';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

const quickLinks = [
  {
    to: '/admin/verification',
    Icon: IconShield,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    title: 'NGO & Volunteer Verification',
    desc: 'Approve, reject, or suspend NGO and volunteer accounts for ecosystem trust.',
    cta: 'Verification Portal',
    ctaClass: 'btn-primary',
  },
  {
    to: '/admin/users',
    Icon: IconUsers,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    title: 'User Management',
    desc: 'Review, verify, and deactivate/activate donor, NGO, and volunteer profiles.',
    cta: 'Manage Users',
    ctaClass: 'btn-secondary',
  },
  {
    to: '/admin/donations',
    Icon: IconUtensils,
    color: 'var(--orange-400)',
    bg: 'rgba(249,115,22,0.08)',
    title: 'Donation Management',
    desc: 'Review and moderate all food listings. Cancel inappropriate content.',
    cta: 'Manage Food',
    ctaClass: 'btn-secondary',
  },
];

const AdminDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics'),
      api.get('/admin/donations')
    ])
      .then(([analyticsRes, donRes]) => {
        setAnalyticsData(analyticsRes.data);
        setRecentDonations(donRes.data.donations ? donRes.data.donations.slice(0, 5) : []);
      })
      .catch(err => console.error('Admin Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-dashboard-wrapper">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard &amp; Ecosystem Analytics</h1>
        <p className="page-subtitle">Real-time monitoring, ecosystem metrics, and donation workflow intelligence.</p>
      </div>

      {/* Analytics KPI Cards */}
      {analyticsData?.kpis && <AnalyticsKpiCards kpis={analyticsData.kpis} />}

      {/* Charts */}
      {analyticsData?.charts && (
        <div style={{ marginBottom: '2.5rem' }}>
          <AnalyticsCharts charts={analyticsData.charts} />
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {quickLinks.map((ql) => (
          <div key={ql.to} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: ql.bg, color: ql.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <ql.Icon size={18} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ql.title}</h4>
            </div>
            <p className="text-muted text-sm">{ql.desc}</p>
            <Link to={ql.to} className={`btn ${ql.ctaClass} btn-sm`} style={{ alignSelf: 'flex-start' }}>
              {ql.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Recent Donations Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconList size={18} style={{ color: 'var(--text-secondary)' }} />
            Recent Platform Activity
          </h2>
          <Link to="/admin/donations" className="btn btn-secondary btn-sm">View All Listings</Link>
        </div>

        {recentDonations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconList size={40}/></div>
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
                  <th>Expiry &amp; Time Left</th>
                  <th>Workflow Status</th>
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
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(d.expiryDate)}</span>
                        <ExpiryBadge expiryDate={d.expiryDate} showTime={true} />
                      </div>
                    </td>
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

      {/* Feedback Stats */}
      <AdminFeedbackStats />
    </div>
  );
};

export default AdminDashboard;
