import { useState } from 'react';

const STATUS_COLORS = {
  Available: '#22c55e',
  Accepted: '#3b82f6',
  'In Transit': '#a855f7',
  Completed: '#10b981',
  Cancelled: '#f97316',
  Expired: '#ef4444',
};

const CATEGORY_COLORS = [
  '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#06b6d4', '#eab308', '#64748b'
];

const AnalyticsCharts = ({ charts }) => {
  const [activeTab, setActiveTab] = useState('all');

  if (!charts) return null;

  const { statusDistribution = [], categoryDistribution = [], priorityDistribution = [], monthlyStats = [], completedVsExpired = {} } = charts;

  // Calculate totals
  const totalStatusCount = statusDistribution.reduce((acc, cur) => acc + cur.count, 0);
  const totalCategoryCount = categoryDistribution.reduce((acc, cur) => acc + cur.count, 0);
  const maxMonthly = Math.max(...monthlyStats.map((m) => m.total), 1);

  return (
    <div className="analytics-charts-section">
      <div className="analytics-header">
        <h3 className="analytics-section-title">📈 Analytics & Visualizations</h3>
        <p className="analytics-section-subtitle">Real-time operational distribution and trends from database records.</p>
      </div>

      <div className="charts-grid">
        {/* Chart 1: Donation Status Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>📊 Donation Status Distribution</h4>
            <span className="chart-badge">{totalStatusCount} Total Logged</span>
          </div>
          <p className="chart-desc">Breakdown of surplus food listings by current workflow status.</p>

          {totalStatusCount === 0 ? (
            <div className="chart-empty-state">
              <span>📭</span>
              <p>No donation status records available yet.</p>
            </div>
          ) : (
            <div className="status-bars-container">
              {statusDistribution.map((item) => {
                const percentage = totalStatusCount > 0 ? Math.round((item.count / totalStatusCount) * 100) : 0;
                const color = STATUS_COLORS[item.status] || '#64748b';

                return (
                  <div key={item.status} className="status-bar-item">
                    <div className="status-bar-info">
                      <span className="status-bar-label">
                        <span className="color-dot" style={{ backgroundColor: color }} />
                        {item.status}
                      </span>
                      <span className="status-bar-count">
                        <strong>{item.count}</strong> ({percentage}%)
                      </span>
                    </div>
                    <div className="status-progress-track">
                      <div
                        className="status-progress-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Donations by Food Category */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>🥗 Food Category Breakdown</h4>
            <span className="chart-badge">{categoryDistribution.length} Categories</span>
          </div>
          <p className="chart-desc">Categorization of surplus food donations.</p>

          {categoryDistribution.length === 0 ? (
            <div className="chart-empty-state">
              <span>🍽️</span>
              <p>No category data logged yet.</p>
            </div>
          ) : (
            <div className="category-bars-container">
              {categoryDistribution.map((item, idx) => {
                const percentage = totalCategoryCount > 0 ? Math.round((item.count / totalCategoryCount) * 100) : 0;
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

                return (
                  <div key={item.category} className="category-bar-item">
                    <div className="category-bar-info">
                      <span className="category-name">{item.category}</span>
                      <span className="category-count">
                        <strong>{item.count}</strong> items ({percentage}%)
                      </span>
                    </div>
                    <div className="category-progress-track">
                      <div
                        className="category-progress-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 3: Smart Priority Distribution */}
        {priorityDistribution && priorityDistribution.length > 0 && (
          <div className="chart-card">
            <div className="chart-header">
              <h4>🎯 Donation Priority Distribution</h4>
              <span className="chart-badge">Active Surplus Food</span>
            </div>
            <p className="chart-desc">Real-time redistribution urgency breakdown for active available items.</p>

            <div className="status-bars-container">
              {priorityDistribution.map((item) => {
                const totalPriority = priorityDistribution.reduce((acc, cur) => acc + cur.count, 0);
                const percentage = totalPriority > 0 ? Math.round((item.count / totalPriority) * 100) : 0;

                return (
                  <div key={item.level} className="status-bar-item">
                    <div className="status-bar-info">
                      <span className="status-bar-label">
                        <span className="color-dot" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <span className="status-bar-count">
                        <strong>{item.count}</strong> items ({percentage}%)
                      </span>
                    </div>
                    <div className="status-progress-track">
                      <div
                        className="status-progress-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart 3: Monthly Donation Statistics */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h4>📅 Monthly Donation Trends</h4>
            <span className="chart-badge">Past 6 Months</span>
          </div>
          <p className="chart-desc">Monthly volume of food donations and completion performance.</p>

          <div className="monthly-chart-wrapper">
            <div className="monthly-chart-bars">
              {monthlyStats.map((m) => {
                const heightPercent = maxMonthly > 0 ? Math.round((m.total / maxMonthly) * 100) : 0;
                const completedPercent = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;

                return (
                  <div key={m.label} className="monthly-column">
                    <div className="monthly-bar-stack" title={`${m.label}: ${m.total} total (${m.completed} completed, ${m.expired} expired)`}>
                      <div
                        className="monthly-bar-total"
                        style={{ height: `${Math.max(heightPercent, 8)}%` }}
                      >
                        <div
                          className="monthly-bar-completed"
                          style={{ height: `${completedPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="monthly-label">{m.label}</div>
                    <div className="monthly-values">
                      <span className="total-val">{m.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="monthly-legend">
              <div className="legend-item">
                <span className="legend-color total-color" />
                <span>Total Donations</span>
              </div>
              <div className="legend-item">
                <span className="legend-color completed-color" />
                <span>Completed Deliveries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Completed vs Expired Donations */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h4>⚡ Completed vs Expired Comparison</h4>
            <span className="chart-badge green">
              Success Rate: {completedVsExpired.successRate || 0}%
            </span>
          </div>
          <p className="chart-desc">Direct outcome comparison of successfully redistributed surplus food versus expired items.</p>

          <div className="comparison-content">
            <div className="comparison-metric-card success">
              <div className="comp-icon">🎉</div>
              <div className="comp-info">
                <span className="comp-num">{completedVsExpired.completed || 0}</span>
                <span className="comp-label">Completed Deliveries</span>
              </div>
            </div>

            <div className="comparison-metric-card expired">
              <div className="comp-icon">⌛</div>
              <div className="comp-info">
                <span className="comp-num">{completedVsExpired.expired || 0}</span>
                <span className="comp-label">Expired Donations</span>
              </div>
            </div>

            <div className="comparison-gauge">
              <div className="gauge-header">
                <span>Distribution Efficiency Ratio</span>
                <strong>{completedVsExpired.successRate || 0}% Success</strong>
              </div>
              <div className="gauge-track">
                <div
                  className="gauge-fill completed"
                  style={{
                    width: `${completedVsExpired.successRate || 0}%`,
                  }}
                  title={`Completed: ${completedVsExpired.completed}`}
                />
                <div
                  className="gauge-fill expired"
                  style={{
                    width: `${100 - (completedVsExpired.successRate || 0)}%`,
                  }}
                  title={`Expired: ${completedVsExpired.expired}`}
                />
              </div>
              <div className="gauge-labels">
                <span className="text-green">✓ {completedVsExpired.completed} Rescued</span>
                <span className="text-red">✕ {completedVsExpired.expired} Expired</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
