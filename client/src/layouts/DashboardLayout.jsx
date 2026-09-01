import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';

const SIDEBAR_CONFIG = {
  donor: [
    { to: '/donor/dashboard',    icon: '📊', label: 'Dashboard' },
    { to: '/donor/add-donation', icon: '➕', label: 'Add Donation' },
    { to: '/donor/my-donations', icon: '📋', label: 'My Donations' },
    { to: '/donor/profile',      icon: '👤', label: 'Profile' },
  ],
  ngo: [
    { to: '/ngo/dashboard',  icon: '📊', label: 'Dashboard' },
    { to: '/ngo/available',  icon: '🌿', label: 'Available Donations' },
    { to: '/ngo/accepted',   icon: '✅', label: 'Accepted Donations' },
    { to: '/ngo/profile',    icon: '👤', label: 'Profile' },
  ],
  volunteer: [
    { to: '/volunteer/dashboard',  icon: '📊', label: 'Dashboard' },
    { to: '/volunteer/deliveries', icon: '🚴', label: 'My Deliveries' },
    { to: '/volunteer/profile',    icon: '👤', label: 'Profile' },
  ],
  admin: [
    { to: '/admin/dashboard',  icon: '📊', label: 'Dashboard' },
    { to: '/admin/users',      icon: '👥', label: 'Users' },
    { to: '/admin/donations',  icon: '🍽️',  label: 'Donations' },
  ],
};

const ROLE_LABEL = {
  donor: 'Donor Panel',
  ngo: 'NGO Panel',
  volunteer: 'Volunteer Panel',
  admin: 'Admin Panel',
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user?.role}
                </div>
              </div>
            </div>
          </div>

          {/* Nav section label */}
          <div className="sidebar-section">{ROLE_LABEL[role]}</div>

          {/* Nav Links */}
          <nav className="sidebar-nav">
            {links.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-icon">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Logout at bottom */}
          <div style={{ padding: '1.5rem 0.75rem 0', marginTop: 'auto' }}>
            <button onClick={handleLogout} className="btn btn-danger btn-sm btn-block">
              🚪 Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
