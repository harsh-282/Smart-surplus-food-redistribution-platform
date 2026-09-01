const About = () => (
  <>
    {/* Hero */}
    <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 60%)' }}>
      <div className="container">
        <div className="hero-badge" style={{ display: 'inline-flex', marginBottom: '1rem' }}>About FoodShare</div>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 800, marginBottom: '1rem' }}>
          Building a World With <span style={{ color: 'var(--green-400)' }}>Zero Food Waste</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          FoodShare is a student-built platform that connects surplus food with people who need it,
          creating a sustainable ecosystem of sharing and compassion.
        </p>
      </div>
    </section>

    {/* Mission */}
    <section className="section">
      <div className="container">
        <div className="grid-2" style={{ alignItems: 'center', gap: '4rem' }}>
          <div>
            <div className="hero-badge" style={{ display: 'inline-flex', marginBottom: '1rem' }}>Our Mission</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Why We Built This</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem' }}>
              In India, approximately <strong style={{ color: 'var(--green-400)' }}>40% of all food produced</strong> is wasted,
              while millions go to bed hungry every night. This stark contrast inspired us to build FoodShare.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem' }}>
              From marriage halls discarding hundreds of plates of biryani, to restaurants throwing away
              day-old bread — surplus edible food exists everywhere. Our platform creates the bridge
              between those who have excess and those who have none.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              By leveraging technology, we streamline the entire process from donation to delivery,
              making food redistribution efficient, transparent, and impactful.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '🌿', title: 'Reduce Waste', desc: 'Divert edible surplus food from landfills' },
              { icon: '🤝', title: 'Build Community', desc: 'Connect donors, NGOs and volunteers' },
              { icon: '📊', title: 'Track Impact', desc: 'Monitor every donation end-to-end' },
              { icon: '🔒', title: 'Ensure Safety', desc: 'Only verified users participate in redistribution' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* The 4 Roles */}
    <section className="section" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <h2 className="section-title">Four Roles, One Goal</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>Everyone has a part to play in ending food waste.</p>
        </div>
        <div className="grid-4">
          {[
            { icon: '🍽️', role: 'Donor', color: 'var(--orange-400)', desc: 'Restaurants, hotels, marriage halls, and households who have surplus food to share.' },
            { icon: '🏢', role: 'NGO',   color: '#3b82f6',           desc: 'Organizations that accept donations and distribute food to communities in need.' },
            { icon: '🚴', role: 'Volunteer', color: '#a855f7',       desc: 'Individuals who handle pickup and delivery between donors and NGOs.' },
            { icon: '👑', role: 'Admin',  color: '#ef4444',          desc: 'Platform administrators who monitor all activity and ensure smooth operations.' },
          ].map((r, i) => (
            <div key={i} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{r.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: r.color, marginBottom: '0.5rem' }}>{r.role}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Tech Stack */}
    <section className="section">
      <div className="container">
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <h2 className="section-title">Built With</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>Modern MERN stack technology for a reliable platform.</p>
        </div>
        <div className="grid-3" style={{ gap: '1rem' }}>
          {[
            { tech: 'React.js', desc: 'Frontend UI', icon: '⚛️' },
            { tech: 'Node.js + Express', desc: 'Backend API', icon: '🟩' },
            { tech: 'MongoDB', desc: 'Database', icon: '🍃' },
            { tech: 'JWT Auth', desc: 'Security', icon: '🔐' },
            { tech: 'Cloudinary', desc: 'Image Storage', icon: '☁️' },
            { tech: 'Mongoose', desc: 'ODM', icon: '🐉' },
          ].map((t, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{t.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.tech}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default About;
