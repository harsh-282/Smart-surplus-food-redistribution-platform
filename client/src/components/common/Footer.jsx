import { Link } from 'react-router-dom';
import { IconLeaf, IconHome, IconInfo, IconUser, IconBike, IconBuilding, IconCrown, IconSprout } from './Icons';

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div>
        <div className="footer-brand">
          <IconLeaf size={20} style={{ color: 'var(--green-400)' }} />
          FoodShare
        </div>
        <p className="footer-desc">
          Reducing food waste by connecting donors, NGOs, and volunteers
          to redistribute surplus food to communities in need.
        </p>
        <div className="footer-social">
          <a href="#" aria-label="GitHub" className="footer-social-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
          </a>
          <a href="#" aria-label="LinkedIn" className="footer-social-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <a href="#" aria-label="Twitter" className="footer-social-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
          </a>
        </div>
      </div>
      <div>
        <div className="footer-heading">Platform</div>
        <div className="footer-links">
          <Link to="/"><IconHome size={13} /> Home</Link>
          <Link to="/about"><IconInfo size={13} /> About</Link>
          <Link to="/register"><IconUser size={13} /> Register</Link>
          <Link to="/login"><IconLeaf size={13} /> Login</Link>
        </div>
      </div>
      <div>
        <div className="footer-heading">Roles</div>
        <div className="footer-links">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <IconLeaf size={13} style={{ color: 'var(--orange-400)' }} /> Donors
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <IconBuilding size={13} style={{ color: '#3b82f6' }} /> NGOs
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <IconBike size={13} style={{ color: '#a855f7' }} /> Volunteers
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <IconCrown size={13} style={{ color: '#ef4444' }} /> Admin
          </span>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <span className="footer-copy">© 2024 FoodShare. Built for reducing food waste.</span>
      <span className="footer-copy" style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
        <IconSprout size={13} style={{ color: 'var(--green-400)' }} />
        Mini Project — B.Tech AI &amp; DS
      </span>
    </div>
  </footer>
);

export default Footer;
