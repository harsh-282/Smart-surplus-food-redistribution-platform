import StatCard from '../common/StatCard';

const AnalyticsKpiCards = ({ kpis }) => {
  if (!kpis) return null;

  return (
    <div className="analytics-kpi-container" style={{ marginBottom: '2.5rem' }}>
      <h3 className="analytics-section-title">📊 Ecosystem KPI Overview</h3>

      {/* Row 1: Ecosystem Members */}
      <div className="analytics-grid-5" style={{ marginBottom: '1.25rem' }}>
        <StatCard
          icon="👥"
          value={kpis.totalUsers || 0}
          label="Total Users"
          colorClass="blue"
        />
        <StatCard
          icon="🍽️"
          value={kpis.totalDonors || 0}
          label="Total Donors"
          colorClass="orange"
        />
        <StatCard
          icon="🏢"
          value={kpis.totalNGOs || 0}
          label="Total NGOs"
          colorClass="teal"
        />
        <StatCard
          icon="🚴"
          value={kpis.totalVolunteers || 0}
          label="Total Volunteers"
          colorClass="purple"
        />
        <StatCard
          icon="📦"
          value={kpis.totalDonations || 0}
          label="Total Donations"
          colorClass="blue"
        />
      </div>

      {/* Row 2: Workflow & Logistics Status */}
      <div className="analytics-grid-5">
        <StatCard
          icon="🟢"
          value={kpis.availableDonations || 0}
          label="Available Donations"
          colorClass="green"
        />
        <StatCard
          icon="🤝"
          value={kpis.acceptedDonations || 0}
          label="Accepted Donations"
          colorClass="orange"
        />
        <StatCard
          icon="🎉"
          value={kpis.completedDeliveries || 0}
          label="Completed Deliveries"
          colorClass="green"
        />
        <StatCard
          icon="⏳"
          value={kpis.nearExpiryDonations || 0}
          label="Near-Expiry (< 24h)"
          colorClass="orange"
        />
        <StatCard
          icon="⌛"
          value={kpis.expiredDonations || 0}
          label="Expired Donations"
          colorClass="red"
        />
      </div>
    </div>
  );
};

export default AnalyticsKpiCards;
