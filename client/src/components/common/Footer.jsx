import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div>
        <div className="footer-brand">🌿 FoodShare</div>
        <p className="footer-desc">
          Reducing food waste by connecting donors, NGOs, and volunteers
          to redistribute surplus food to communities in need.
        </p>
      </div>
      <div>
        <div className="footer-heading">Platform</div>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
        </div>
      </div>
      <div>
        <div className="footer-heading">Roles</div>
        <div className="footer-links">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>🍽️ Donors</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>🏢 NGOs</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>🚴 Volunteers</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>👑 Admin</span>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <span className="footer-copy">© 2024 FoodShare. Built for reducing food waste.</span>
      <span className="footer-copy">🌿 Mini Project — B.Tech AI & DS</span>
    </div>
  </footer>
);

export default Footer;
