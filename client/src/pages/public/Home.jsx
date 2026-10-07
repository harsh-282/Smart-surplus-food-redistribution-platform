import { Link } from 'react-router-dom';
import {
  IconUtensils, IconBuilding, IconBike, IconHandshake,
  IconLeaf, IconSprout, IconRecycle
} from '../../components/common/Icons';

const roles = [
  {
    value: 'donor',
    Icon: IconUtensils,
    title: 'Are you a Donor?',
    desc: 'Restaurants, hotels, and households post surplus food with details and photos.',
    link: '/register',
    cta: 'Register as Donor',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    btnStyle: { background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' },
  },
  {
    value: 'ngo',
    Icon: IconBuilding,
    title: 'Are you an NGO?',
    desc: 'Browse and accept food donations to distribute to communities you serve.',
    link: '/register',
    cta: 'Register as NGO',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    btnStyle: { background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' },
  },
  {
    value: 'volunteer',
    Icon: IconBike,
    title: 'Want to Volunteer?',
    desc: 'Join as a delivery volunteer and help bridge the gap between donors and NGOs.',
    link: '/register',
    cta: 'Register as Volunteer',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    btnStyle: { background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(168,85,247,0.35)' },
  },
];

const steps = [
  { num: 1, Icon: IconUtensils,  title: 'Donors Post Food',    desc: 'Restaurants, hotels, and households post surplus food with details and photos.' },
  { num: 2, Icon: IconBuilding,  title: 'NGOs Accept',         desc: 'NGOs browse available donations and accept the ones they can distribute.' },
  { num: 3, Icon: IconBike,      title: 'Volunteers Pick Up',  desc: 'Volunteers are assigned and pick up the food from the donor location.' },
  { num: 4, Icon: IconHandshake, title: 'Communities Benefit', desc: 'Food is delivered to those in need, reducing waste and supporting communities.' },
];

const Home = () => (
  <>
    {/* Hero */}
    <section className="hero">
      <div className="hero-bg-particles">
        {[...Array(6)].map((_, i) => <div key={i} className={`hero-particle hero-particle-${i + 1}`} />)}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-badge">
          <IconLeaf size={14} />
          Fighting Food Waste, One Meal at a Time
        </div>
        <h1 className="hero-title">
          Reduce Food Waste.<br />
          <span className="highlight">Redistribute Surplus.</span><br />
          Support Communities.
        </h1>
        <p className="hero-subtitle">
          A smart platform connecting food donors, NGOs, and volunteers
          to ensure surplus food reaches those who need it most — before it goes to waste.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg hero-btn-primary">
            Get Started Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
          <Link to="/about" className="btn btn-secondary btn-lg">Learn More</Link>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-num">500+</div>
            <div className="hero-stat-label">Meals Saved</div>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <div className="hero-stat-num">50+</div>
            <div className="hero-stat-label">NGOs Joined</div>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <div className="hero-stat-num">100+</div>
            <div className="hero-stat-label">Volunteers</div>
          </div>
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="section">
      <div className="container">
        <div className="text-center mb-2">
          <div className="hero-badge" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <IconRecycle size={14} />
            How It Works
          </div>
          <h2 className="section-title">Simple 4-Step Process</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            From surplus food to a happy meal — here's how FoodShare makes it happen.
          </p>
        </div>
        <div className="grid-4" style={{ marginTop: '3rem' }}>
          {steps.map((step) => (
            <div key={step.num} className="how-step">
              <div className="how-step-num">{step.num}</div>
              <div className="how-step-icon">
                <step.Icon size={28} />
              </div>
              <div className="how-step-title">{step.title}</div>
              <p className="how-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Join the Movement */}
    <section className="section home-join-section">
      <div className="container">
        <div className="text-center mb-2">
          <h2 className="section-title">Join the Movement</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Choose your role and start making a difference today.
          </p>
        </div>
        <div className="grid-3" style={{ marginTop: '3rem' }}>
          {roles.map((r, i) => (
            <div key={i} className="role-feature-card">
              <div className="role-feature-icon" style={{ background: r.bg, color: r.color }}>
                <r.Icon size={30} />
              </div>
              <h3 className="role-feature-title">{r.title}</h3>
              <p className="role-feature-desc">{r.desc}</p>
              <Link
                to={r.link}
                className="btn btn-sm role-feature-btn"
                style={r.btnStyle}
              >
                {r.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA Banner */}
    <section className="section" style={{ textAlign: 'center' }}>
      <div className="container">
        <div className="cta-banner">
          <div className="cta-banner-icon">
            <IconSprout size={40} />
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
            Every meal saved is a life changed.
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem', maxWidth: 500, margin: '0 auto 2rem', position: 'relative', zIndex: 1 }}>
            Join hundreds of donors, NGOs, and volunteers already making a difference in their communities.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ position: 'relative', zIndex: 1 }}>
            Start Today — It&apos;s Free
          </Link>
        </div>
      </div>
    </section>
  </>
);

export default Home;
