import { Link } from 'react-router-dom';

const steps = [
  { num: 1, icon: '🍽️', title: 'Donors Post Food', desc: 'Restaurants, hotels, and households post surplus food with details and photos.' },
  { num: 2, icon: '🏢', title: 'NGOs Accept', desc: 'NGOs browse available donations and accept the ones they can distribute.' },
  { num: 3, icon: '🚴', title: 'Volunteers Pick Up', desc: 'Volunteers are assigned and pick up the food from the donor location.' },
  { num: 4, icon: '🤝', title: 'Communities Benefit', desc: 'Food is delivered to those in need, reducing waste and supporting communities.' },
];

const roles = [
  { icon: '🍽️', title: 'Are you a Donor?', desc: 'Post surplus food from your restaurant, hotel, or home and help reduce waste.', link: '/register', cta: 'Register as Donor' },
  { icon: '🏢', title: 'Are you an NGO?', desc: 'Browse and accept food donations to distribute to communities you serve.', link: '/register', cta: 'Register as NGO' },
  { icon: '🚴', title: 'Want to Volunteer?', desc: 'Join as a delivery volunteer and help bridge the gap between donors and NGOs.', link: '/register', cta: 'Register as Volunteer' },
];

const Home = () => (
  <>
    {/* Hero */}
    <section className="hero">
      <div>
        <div className="hero-badge">🌿 Fighting Food Waste, One Meal at a Time</div>
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
          <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
          <Link to="/about" className="btn btn-secondary btn-lg">Learn More</Link>
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="section">
      <div className="container">
        <div className="text-center mb-2">
          <div className="hero-badge" style={{ display: 'inline-flex', marginBottom: '1rem' }}>How It Works</div>
          <h2 className="section-title">Simple 4-Step Process</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            From surplus food to a happy meal — here's how FoodShare makes it happen.
          </p>
        </div>
        <div className="grid-4" style={{ marginTop: '3rem' }}>
          {steps.map((step) => (
            <div key={step.num} className="how-step">
              <div className="how-step-num">{step.num}</div>
              <div className="how-step-icon">{step.icon}</div>
              <div className="how-step-title">{step.title}</div>
              <p className="how-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Join Us */}
    <section className="section" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        <div className="text-center mb-2">
          <h2 className="section-title">Join the Movement</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Choose your role and start making a difference today.
          </p>
        </div>
        <div className="grid-3" style={{ marginTop: '3rem' }}>
          {roles.map((r, i) => (
            <div key={i} className="card card-hover" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{r.icon}</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{r.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{r.desc}</p>
              <Link to={r.link} className="btn btn-primary btn-sm">{r.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA Banner */}
    <section className="section" style={{ textAlign: 'center' }}>
      <div className="container">
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(249,115,22,0.05))',
          border: '1px solid var(--green-border)', borderRadius: 'var(--radius-xl)', padding: '4rem 2rem'
        }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '1rem' }}>
            Every meal saved is a life changed. 🌱
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem', maxWidth: 500, margin: '0 auto 2rem' }}>
            Join hundreds of donors, NGOs, and volunteers already making a difference in their communities.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">Start Today — It's Free</Link>
        </div>
      </div>
    </section>
  </>
);

export default Home;
