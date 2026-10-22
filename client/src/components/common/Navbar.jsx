import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from './NotificationBell';
import QRScannerModal from './QRScannerModal';
import Logo from './Logo';
import {
  IconLeaf, IconLayoutDashboard, IconPlus, IconList, IconUser,
  IconBuilding, IconMapPin, IconBike, IconShield, IconUsers, IconCrown,
  IconSun, IconMoon, IconQrCode, IconX, IconMenu, IconHome, IconInfo,
  IconLogOut, IconCheckCircle, IconUtensils
} from './Icons';

const ROLE_NAV_LINKS = {
  donor: [
    { to: '/donor/dashboard',    label: 'Dashboard',    Icon: IconLayoutDashboard },
    { to: '/donor/add-donation', label: 'Add Donation', Icon: IconPlus },
    { to: '/donor/my-donations', label: 'My Donations', Icon: IconList },
    { to: '/donor/profile',      label: 'Profile',      Icon: IconUser },
  ],
  ngo: [
    { to: '/ngo/dashboard',        label: 'Dashboard',          Icon: IconLayoutDashboard },
    { to: '/ngo/available',        label: 'Available Donations', Icon: IconLeaf },
    { to: '/ngo/nearby-donations', label: 'Nearby Donations',   Icon: IconMapPin },
    { to: '/ngo/accepted',         label: 'Accepted Donations', Icon: IconCheckCircle },
    { to: '/ngo/profile',          label: 'Profile',            Icon: IconUser },
  ],
  volunteer: [
    { to: '/volunteer/dashboard',  label: 'Dashboard',   Icon: IconLayoutDashboard },
    { to: '/volunteer/deliveries', label: 'My Deliveries', Icon: IconBike },
    { to: '/volunteer/profile',    label: 'Profile',     Icon: IconUser },
  ],
  admin: [
    { to: '/admin/dashboard',    label: 'Dashboard',   Icon: IconLayoutDashboard },
    { to: '/admin/verification', label: 'Verification', Icon: IconShield },
    { to: '/admin/users',        label: 'Users',        Icon: IconUsers },
    { to: '/admin/donations',    label: 'Donations',    Icon: IconUtensils },
  ],
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setMobileOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

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
          <span className="navbar-logo-icon">
            <Logo size={36} />
          </span>
          <span className="navbar-logo-text">Food<span>Share</span></span>
        </Link>

        {/* Desktop Center Links */}
        <div className="navbar-links desktop-only">
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
            <IconHome size={15} />
            Home
          </Link>
          <Link to="/about" className={`navbar-link ${location.pathname === '/about' ? 'active' : ''}`}>
            <IconInfo size={15} />
            About
          </Link>
          {user && (
            <Link to={getDashboardLink()} className={`navbar-link ${location.pathname.includes('/dashboard') ? 'active' : ''}`}>
              <IconLayoutDashboard size={15} />
              Dashboard
            </Link>
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
            {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
          </button>

          {user ? (
            <>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="btn btn-secondary btn-sm navbar-qr-btn"
                style={{ gap: '0.3rem', padding: '0.35rem 0.7rem' }}
                title="Scan FoodShare QR Code"
              >
                <IconQrCode size={14} />
                <span className="qr-btn-text">Scan QR</span>
              </button>
              <NotificationBell />
              <div
                className="user-avatar desktop-only"
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ cursor: 'pointer' }}
                title={`${user.name} (${user.role})`}
              >
                {getInitials(user.name)}
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm desktop-only navbar-logout-btn">
                <IconLogOut size={14} />
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
            {mobileOpen ? <IconX size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu - Portal to document.body */}
      {mobileOpen && typeof document !== 'undefined' && createPortal(
        <div className="mobile-drawer-overlay" onClick={closeMenu} role="dialog" aria-modal="true" aria-label="Mobile navigation">
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
                  <Logo size={28} />
                  FoodShare
                </div>
              )}
              <button className="mobile-close-btn" onClick={closeMenu} aria-label="Close menu"><IconX size={18} /></button>
            </div>

            <div className="mobile-drawer-links">
              <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
                <IconHome size={16} /> Home
              </Link>
              <Link to="/about" className="mobile-nav-link" onClick={closeMenu}>
                <IconInfo size={16} /> About
              </Link>

              {user ? (
                <>
                  <div className="mobile-section-title">Panel Navigation ({user.role})</div>
                  {roleLinks.map((link) => {
                    const Icon = link.Icon;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`mobile-nav-link ${location.pathname === link.to ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        <Icon size={16} /> {link.label}
                      </Link>
                    );
                  })}

                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={handleLogout} className="btn btn-danger btn-block" style={{ minHeight: '44px', gap: '0.5rem' }}>
                      <IconLogOut size={16} /> Logout
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
        </div>,
        document.body
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
