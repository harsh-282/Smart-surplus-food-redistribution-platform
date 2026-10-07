import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import VerificationBadge from '../../components/common/VerificationBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  IconLeaf, IconCheckCircle, IconBike, IconBuilding,
  IconAlertTriangle, IconClock, IconBan, IconMapPin
} from '../../components/common/Icons';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

const VerificationBanner = ({ status, rejectionReason, profileLink }) => {
  if (status === 'Verified') return null;

  const configs = {
    Rejected: {
      bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)', color: '#dc2626',
      Icon: IconAlertTriangle, title: 'Verification Not Approved',
    },
    Suspended: {
      bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)', color: '#6b7280',
      Icon: IconBan, title: 'Account Suspended',
    },
    Pending: {
      bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.25)', color: '#ea580c',
      Icon: IconClock, title: 'Pending Verification',
    },
  };
  const cfg = configs[status] || configs.Pending;

  return (
    <div style={{
      marginBottom: '1.5rem', padding: '1.25rem 1.5rem',
      borderRadius: '12px', border: `1px solid ${cfg.border}`,
      background: cfg.bg, color: cfg.color,
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <cfg.Icon size={16} />
        {cfg.title}
      </div>
      <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.85 }}>
        {status === 'Rejected'
          ? `Reason: "${rejectionReason || 'Profile information is incomplete.'}" Please update your profile and resubmit.`
          : status === 'Suspended'
          ? 'Your account is currently suspended. Contact admin for support.'
          : 'Your account is awaiting administrator review. Claiming will be enabled once verified.'}
      </p>
      {status === 'Rejected' && (
        <div style={{ marginTop: '0.875rem' }}>
          <Link to={profileLink} className="btn btn-primary btn-sm">Update Profile &amp; Resubmit</Link>
        </div>
      )}
    </div>
  );
};

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
    available:  available.length,
    accepted:   accepted.filter(d => d.status === 'Accepted').length,
    inProgress: accepted.filter(d => ['Pickup Assigned', 'Picked Up', 'Delivered'].includes(d.status)).length,
    completed:  accepted.filter(d => d.status === 'Completed').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Manage your accepted food donations and track distribution.</p>
        </div>
        <VerificationBadge status={user?.verificationStatus} role="ngo" size="md" />
      </div>

      <VerificationBanner
        status={user?.verificationStatus}
        rejectionReason={user?.verificationRejectionReason}
        profileLink="/ngo/profile"
      />

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard icon={<IconLeaf size={20}/>}        value={stats.available}  label="Available to Accept" colorClass="green" />
        <StatCard icon={<IconCheckCircle size={20}/>} value={stats.accepted}   label="Accepted"            colorClass="blue" />
        <StatCard icon={<IconBike size={20}/>}        value={stats.inProgress} label="In Progress"         colorClass="orange" />
        <StatCard icon={<IconBuilding size={20}/>}    value={stats.completed}  label="Completed"           colorClass="teal" />
      </div>

      {/* Quick Action Cards */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderColor: 'var(--green-border)', background: 'var(--green-glow)' }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Browse Available Food</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {stats.available} active food items available to accept.
            </p>
          </div>
          <Link to="/ngo/available" className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <IconLeaf size={15}/> View List
          </Link>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Interactive Nearby Map</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Visually discover surplus food locations around your NGO.
            </p>
          </div>
          <Link to="/ngo/nearby-donations" className="btn btn-secondary" style={{ gap: '0.5rem' }}>
            <IconMapPin size={15}/> Open Map
          </Link>
        </div>
      </div>

      {/* Recent Accepted Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Recently Accepted</h2>
          <Link to="/ngo/accepted" className="btn btn-secondary btn-sm">View All</Link>
        </div>

        {accepted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconBuilding size={40}/></div>
            <div className="empty-state-title">No accepted donations yet</div>
            <div className="empty-state-desc">Browse available donations and accept ones you can distribute.</div>
            <Link to="/ngo/available" className="btn btn-primary">Browse Donations</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Donor</th>
                  <th>Quantity</th>
                  <th>Expiry</th>
                  <th>Volunteer</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {accepted.slice(0, 5).map(d => (
                  <tr key={d._id}>
                    <td><strong>{d.foodName}</strong></td>
                    <td>{d.donorId?.name}</td>
                    <td>{d.quantity}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(d.expiryDate)}</td>
                    <td>{d.volunteerId?.name || <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Not assigned</span>}</td>
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
