import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import OfflineBanner from '../components/common/OfflineBanner';
import PushNotificationBanner from '../components/common/PushNotificationBanner';
import {
  IconLayoutDashboard, IconPlus, IconList, IconUser,
  IconLeaf, IconMapPin, IconCheckCircle, IconBike,
  IconShield, IconUsers, IconUtensils, IconLogOut
} from '../components/common/Icons';

const SIDEBAR_CONFIG = {
  donor: [
    { to: '/donor/dashboard',    Icon: IconLayoutDashboard, label: 'Dashboard' },
    { to: '/donor/add-donation', Icon: IconPlus,            label: 'Add Donation' },
    { to: '/donor/my-donations', Icon: IconList,            label: 'My Donations' },
    { to: '/donor/profile',      Icon: IconUser,            label: 'Profile' },
  ],
  ngo: [
    { to: '/ngo/dashboard',  Icon: IconLayoutDashboard, label: 'Dashboard' },
    { to: '/ngo/available',  Icon: IconLeaf,            label: 'Available Donations' },
    { to: '/ngo/accepted',   Icon: IconCheckCircle,     label: 'Accepted Donations' },
    { to: '/ngo/profile',    Icon: IconUser,            label: 'Profile' },
  ],
  volunteer: [
    { to: '/volunteer/dashboard',  Icon: IconLayoutDashboard, label: 'Dashboard' },
    { to: '/volunteer/deliveries', Icon: IconBike,            label: 'My Deliveries' },
    { to: '/volunteer/profile',    Icon: IconUser,            label: 'Profile' },
  ],
  admin: [
    { to: '/admin/dashboard',    Icon: IconLayoutDashboard, label: 'Dashboard' },
    { to: '/admin/verification', Icon: IconShield,          label: 'Verification' },
    { to: '/admin/users',        Icon: IconUsers,           label: 'Users' },
    { to: '/admin/donations',    Icon: IconUtensils,        label: 'Donations' },
  ],
};

const ROLE_LABEL = {
  donor:     'Donor Panel',
  ngo:       'NGO Panel',
  volunteer: 'Volunteer Panel',
  admin:     'Admin Panel',
};

const ROLE_COLOR = {
  donor:     'var(--orange-400)',
  ngo:       '#3b82f6',
  volunteer: '#a855f7',
  admin:     '#ef4444',
};

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = SIDEBAR_CONFIG[role] || [];

  const handleLogout = () => { logout(); navigate('/'); };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <OfflineBanner />
      <Navbar />
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* User Info */}
          <div style={{ padding: '0 1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="user-avatar" style={{ width: 44, height: 44, fontSize: '1rem' }}>
                {getInitials(user?.name)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.7rem', color: ROLE_COLOR[role], textTransform: 'capitalize', fontWeight: 600, marginTop: '0.1rem' }}>
                  {user?.role}
                </div>
              </div>
            </div>
          </div>

          {/* Nav section label */}
          <div className="sidebar-section">{ROLE_LABEL[role]}</div>

          {/* Nav Links */}
          <nav className="sidebar-nav">
            {links.map(({ to, Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-icon"><Icon size={16} /></span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Logout at bottom */}
          <div style={{ padding: '1.5rem 0.75rem 0', marginTop: 'auto' }}>
            <button onClick={handleLogout} className="btn btn-danger btn-sm btn-block" style={{ gap: '0.5rem' }}>
              <IconLogOut size={14} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Mobile Horizontal Tab Navigation */}
          <div className="mobile-subnav-bar">
            {links.map(({ to, Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `mobile-subnav-item${isActive ? ' active' : ''}`}
              >
                <span className="mobile-subnav-icon"><Icon size={16} /></span>
                <span className="mobile-subnav-text">{label}</span>
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="mobile-subnav-item mobile-subnav-logout"
              title="Logout of account"
            >
              <span className="mobile-subnav-icon"><IconLogOut size={16} /></span>
              <span className="mobile-subnav-text">Logout</span>
            </button>
          </div>

          <PushNotificationBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
