const StatCard = ({ icon, value, label, colorClass = 'green', trend }) => (
  <div className="stat-card">
    <div className={`stat-icon ${colorClass}`}>
      {typeof icon === 'string' ? (
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      ) : (
        icon
      )}
    </div>
    <div style={{ flex: 1 }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {trend !== undefined && (
        <div style={{
          fontSize: '0.72rem',
          marginTop: '0.25rem',
          color: trend >= 0 ? 'var(--green-400)' : '#ef4444',
          fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '0.2rem'
        }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% this week
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
