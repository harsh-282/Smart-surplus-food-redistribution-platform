import { Link } from 'react-router-dom';
import TiltCard from '../../components/common/TiltCard';
import SwipeableCarousel from '../../components/common/SwipeableCarousel';
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

const surplusCategories = [
  {
    title: 'Cooked Meals & Catering',
    desc: 'Nutritious hot meals from restaurants, cafeterias, and catered events redistributed safely within peak freshness.',
    image: '/rice-sambar.jpg',
    tag: 'Cooked Food',
  },
  {
    title: 'Breakfast & Morning Tiffin',
    desc: 'Wholesome breakfast items, idli, chutney, and morning meal surplus ready for fast NGO distribution.',
    image: '/idli-chutney.jpg',
    tag: 'Morning Tiffin',
  },
  {
    title: 'Bakery & Packaged Staples',
    desc: 'Breads, buns, baked goods, and shelf-stable packaged dry food distributed to community shelters.',
    image: '/bread-jam.jpg',
    tag: 'Bakery & Pantry',
  },
];

/* Decorative floating botanical leaf SVG */
const BotanicalLeafSvg = ({ className = '', size = 32 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
    aria-hidden="true"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const Home = () => (
  <>
    {/* Hero */}
    <section className="hero">
      {/* Background Particles & Ambient Atmosphere */}
      <div className="hero-ambient-halo" aria-hidden="true" />
      
      <div className="hero-bg-particles">
        {[...Array(6)].map((_, i) => <div key={i} className={`hero-particle hero-particle-${i + 1}`} />)}
      </div>

      {/* Subtle Floating Botanical Elements */}
      <div className="hero-botanicals-wrap" aria-hidden="true">
        <BotanicalLeafSvg className="hero-botanical-leaf hero-botanical-leaf-1" size={44} />
        <BotanicalLeafSvg className="hero-botanical-leaf hero-botanical-leaf-2" size={52} />
        <BotanicalLeafSvg className="hero-botanical-leaf hero-botanical-leaf-3" size={38} />
        <BotanicalLeafSvg className="hero-botanical-leaf hero-botanical-leaf-4" size={42} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-badge">
          <IconLeaf size={14} />
          Every Surplus Meal. A Chance to Nourish.
        </div>
        <h1 className="hero-title">
          Every Surplus Meal.<br />
          <span className="highlight">A Chance to Nourish.</span>
        </h1>
        <p className="hero-subtitle">
          A smart platform connecting food donors, NGOs, and volunteers
          to ensure surplus food reaches those who need it most — before it goes to waste.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg hero-btn-primary">
            Share Food
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
          <Link to="/about" className="btn btn-secondary btn-lg">Explore Donations</Link>
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="section">
      <div className="container">
        <div className="text-center mb-2 reveal-fade-up">
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
            <TiltCard key={step.num} maxTilt={4.5} className={`how-step reveal-fade-up stagger-${step.num}`}>
              <div className="how-step-num">{step.num}</div>
              <div className="how-step-icon">
                <step.Icon size={28} />
              </div>
              <div className="how-step-title">{step.title}</div>
              <p className="how-step-desc">{step.desc}</p>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>

    {/* Food Rescue Categories Showcase */}
    <section className="section" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="container">
        <div className="text-center mb-2 reveal-fade-up">
          <div className="hero-badge" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <IconLeaf size={14} />
            Food Rescue Categories
          </div>
          <h2 className="section-title">Surplus Food We Protect &amp; Share</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            From fresh banquet meals to bakery staples, our platform connects edible surplus with community care.
          </p>
        </div>
        <div style={{ marginTop: '2.5rem' }} className="reveal-fade-up stagger-2">
          <SwipeableCarousel
            items={surplusCategories}
            ariaLabel="Food Rescue Categories"
            renderItem={(cat, idx) => (
              <TiltCard key={idx} maxTilt={4} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ position: 'relative', width: '100%', height: 190, overflow: 'hidden' }}>
                  <img
                    src={cat.image}
                    alt={cat.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                  <span style={{
                    position: 'absolute', top: 12, left: 12,
                    background: 'rgba(23, 77, 56, 0.92)', color: '#FFFFFF',
                    padding: '0.28rem 0.85rem', borderRadius: '999px',
                    fontSize: '0.72rem', fontWeight: 600, backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                  }}>
                    {cat.tag}
                  </span>
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{cat.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{cat.desc}</p>
                  </div>
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/register" style={{ color: 'var(--green-500)', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      Donate Food →
                    </Link>
                    <Link to="/about" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Learn More
                    </Link>
                  </div>
                </div>
              </TiltCard>
            )}
          />
        </div>
      </div>
    </section>

    {/* Join the Movement */}
    <section className="section home-join-section">
      <div className="container">
        <div className="text-center mb-2 reveal-fade-up">
          <h2 className="section-title">Join the Movement</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Choose your role and start making a difference today.
          </p>
        </div>
        <div className="grid-3" style={{ marginTop: '3rem' }}>
          {roles.map((r, i) => (
            <TiltCard key={i} maxTilt={5} className={`role-feature-card reveal-fade-up stagger-${i + 1}`}>
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
            </TiltCard>
          ))}
        </div>
      </div>
    </section>

    {/* CTA Banner */}
    <section className="section" style={{ textAlign: 'center' }}>
      <div className="container">
        <div className="cta-banner reveal-scale">
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
