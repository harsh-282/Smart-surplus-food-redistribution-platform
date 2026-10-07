import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import VerificationBadge from '../../components/common/VerificationBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RouteDistanceCard from '../../components/common/RouteDistanceCard';
import {
  IconList, IconBike, IconPackage, IconCheckCircle,
  IconAlertTriangle, IconClock, IconBan, IconUser
} from '../../components/common/Icons';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

const VerificationBanner = ({ status, rejectionReason, profileLink }) => {
  if (status === 'Verified') return null;
  const configs = {
    Rejected: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)', color: '#dc2626', Icon: IconAlertTriangle, title: 'Verification Not Approved' },
    Suspended: { bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)', color: '#6b7280', Icon: IconBan, title: 'Account Suspended' },
    Pending: { bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.25)', color: '#ea580c', Icon: IconClock, title: 'Pending Verification' },
  };
  const cfg = configs[status] || configs.Pending;
  return (
    <div style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem', borderRadius: '12px', border: `1px solid ${cfg.border}`, background: cfg.bg, color: cfg.color }}>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <cfg.Icon size={16} /> {cfg.title}
      </div>
      <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.85 }}>
        {status === 'Rejected'
          ? `Reason: "${rejectionReason || 'Profile details incomplete.'}" Please update your volunteer profile and resubmit.`
          : status === 'Suspended'
          ? 'Your volunteer account is currently suspended. You cannot receive new delivery assignments.'
          : 'Your volunteer account is awaiting admin verification. Delivery assignments will be enabled after approval.'}
      </p>
      {status === 'Rejected' && (
        <div style={{ marginTop: '0.875rem' }}>
          <Link to={profileLink} className="btn btn-primary btn-sm">Update Profile &amp; Resubmit</Link>
        </div>
      )}
    </div>
  );
};

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/volunteer/deliveries'),
      api.get('/volunteer/profile'),
    ])
      .then(([delRes, profRes]) => {
        setDeliveries(delRes.data.deliveries);
        setProfile(profRes.data.profile);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:     deliveries.length,
    assigned:  deliveries.filter(d => d.status === 'Pickup Assigned').length,
    pickedUp:  deliveries.filter(d => d.status === 'Picked Up').length,
    completed: profile?.completedDeliveries || deliveries.filter(d => d.status === 'Completed').length,
  };

  const pendingDeliveries = deliveries.filter(d => ['Pickup Assigned', 'Picked Up', 'Delivered'].includes(d.status));

  if (loading) return <LoadingSpinner />;

  const availabilityColor = profile?.availability === 'Available' ? '#16a34a' : '#f97316';

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Manage your assigned pickups and update donation delivery progress.</p>
        </div>
        <VerificationBadge status={user?.verificationStatus} role="volunteer" size="md" />
      </div>

      <VerificationBanner
        status={user?.verificationStatus}
        rejectionReason={user?.verificationRejectionReason}
        profileLink="/volunteer/profile"
      />

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard icon={<IconList size={20}/>}        value={stats.total}     label="Total Tasks"      colorClass="blue" />
        <StatCard icon={<IconBike size={20}/>}        value={stats.assigned}  label="Pickup Assigned"  colorClass="orange" />
        <StatCard icon={<IconPackage size={20}/>}     value={stats.pickedUp}  label="Picked Up"        colorClass="purple" />
        <StatCard icon={<IconCheckCircle size={20}/>} value={stats.completed} label="Total Completed"  colorClass="green" />
      </div>

      {/* Availability Banner */}
      <div className="card" style={{
        marginBottom: '2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
        borderColor: profile?.availability === 'Available' ? 'var(--green-border)' : 'rgba(249,115,22,0.3)',
        background: profile?.availability === 'Available' ? 'var(--green-glow)' : 'rgba(249,115,22,0.06)',
      }}>
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Your Current Availability</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Status:{' '}
            <strong style={{ color: availabilityColor }}>
              {profile?.availability === 'Available' ? '● Available' : '● ' + (profile?.availability || 'Offline')}
            </strong>
          </p>
        </div>
        <Link to="/volunteer/profile" className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
          <IconUser size={13}/> Change Availability
        </Link>
      </div>

      {/* Active Deliveries */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Active Deliveries
            {pendingDeliveries.length > 0 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#f97316', color: '#fff', borderRadius: '999px', padding: '0.15rem 0.5rem', fontWeight: 700 }}>
                {pendingDeliveries.length}
              </span>
            )}
          </h2>
          <Link to="/volunteer/deliveries" className="btn btn-secondary btn-sm">View All History</Link>
        </div>

        {pendingDeliveries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconBike size={40}/></div>
            <div className="empty-state-title">No active pickups</div>
            <div className="empty-state-desc">
              You don&apos;t have any pending delivery tasks. Make sure your profile availability is set to &quot;Available&quot;.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {pendingDeliveries.map(d => (
              <div key={d._id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>{d.foodName}</h3>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Qty: {d.quantity} &nbsp;|&nbsp; Category: {d.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusBadge status={d.status} />
                    <Link to={`/volunteer/deliveries/${d._id}`} className="btn btn-primary btn-sm">
                      View Task &amp; Update
                    </Link>
                  </div>
                </div>
                <RouteDistanceCard
                  pickupAddress={d.pickupAddress || d.donorId?.address}
                  pickupCoords={d.pickupCoordinates || d.donorId?.locationCoordinates}
                  destinationAddress={d.acceptedBy?.address}
                  destinationCoords={d.acceptedBy?.locationCoordinates}
                  donorName={d.donorId?.name || 'Donor'}
                  ngoName={d.acceptedBy?.name || 'NGO'}
                  compact={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
