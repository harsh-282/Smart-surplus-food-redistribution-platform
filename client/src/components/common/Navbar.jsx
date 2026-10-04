import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from './NotificationBell';
import QRScannerModal from './QRScannerModal';

const ROLE_NAV_LINKS = {
  donor: [
    { to: '/donor/dashboard', label: '📊 Dashboard' },
    { to: '/donor/add-donation', label: '➕ Add Donation' },
    { to: '/donor/my-donations', label: '📋 My Donations' },
    { to: '/donor/profile', label: '👤 Profile' },
  ],
  ngo: [
    { to: '/ngo/dashboard', label: '📊 Dashboard' },
    { to: '/ngo/available', label: '🌿 Available Donations' },
    { to: '/ngo/nearby-donations', label: '🗺️ Nearby Donations' },
    { to: '/ngo/accepted', label: '✅ Accepted Donations' },
    { to: '/ngo/profile', label: '👤 Profile' },
  ],
  volunteer: [
    { to: '/volunteer/dashboard', label: '📊 Dashboard' },
    { to: '/volunteer/deliveries', label: '🚴 My Deliveries' },
    { to: '/volunteer/profile', label: '👤 Profile' },
  ],
  admin: [
    { to: '/admin/dashboard', label: '📊 Dashboard' },
    { to: '/admin/verification', label: '🛡️ Verification' },
    { to: '/admin/users', label: '👥 Users' },
    { to: '/admin/donations', label: '🍽️ Donations' },
  ],
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    return `/${user.role}/dashboard`;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const closeMenu = () => setMobileOpen(false);
  const roleLinks = user ? ROLE_NAV_LINKS[user.role] || [] : [];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          🌿 Food<span>Share</span>
        </Link>

        {/* Desktop Center Links */}
        <div className="navbar-links desktop-only">
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/about" className={`navbar-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
          {user && (
            <Link to={getDashboardLink()} className={`navbar-link ${location.pathname.includes('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
          )}
        </div>

        {/* Right Controls */}
        <div className="navbar-user">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {user ? (
            <>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.3rem', padding: '0.35rem 0.6rem' }}
                title="Scan FoodShare QR Code"
              >
                📷 Scan QR
              </button>
              <NotificationBell />
              <div className="user-avatar" title={`${user.name} (${user.role})`}>{getInitials(user.name)}</div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm desktop-only">
                Logout
              </button>
            </>
          ) : (
            <div className="desktop-only" style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}

          {/* Hamburger Toggle Button for Mobile */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="mobile-drawer-overlay" onClick={closeMenu}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="user-avatar">{getInitials(user.name)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      Role: {user.role}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>🌿 FoodShare</div>
              )}
              <button className="mobile-close-btn" onClick={closeMenu}>✕</button>
            </div>

            <div className="mobile-drawer-links">
              <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
                🏠 Home
              </Link>
              <Link to="/about" className="mobile-nav-link" onClick={closeMenu}>
                ℹ️ About
              </Link>

              {user ? (
                <>
                  <div className="mobile-section-title">Panel Navigation ({user.role})</div>
                  {roleLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`mobile-nav-link ${location.pathname === link.to ? 'active' : ''}`}
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={handleLogout} className="btn btn-danger btn-block" style={{ minHeight: '44px' }}>
                      🚪 Logout
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <Link to="/login" className="btn btn-secondary btn-block" onClick={closeMenu} style={{ minHeight: '44px' }}>
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-block" onClick={closeMenu} style={{ minHeight: '44px' }}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Global QR Camera Scanner Modal */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
      />
    </nav>
  );
};

export default Navbar;
