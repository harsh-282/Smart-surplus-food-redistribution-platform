import { useState, useEffect } from 'react';
import api from '../../services/api';
import StarRating from '../common/StarRating';
import LoadingSpinner from '../common/LoadingSpinner';

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const AdminFeedbackStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/feedback/admin/summary')
      .then((res) => setData(res.data))
      .catch((err) => console.error('Admin feedback load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data || !data.stats) return null;

  const { stats, recentFeedback } = data;
  const { totalRatings, overallAverage, distribution, roleAverages } = stats;

  return (
    <div className="admin-feedback-wrapper" style={{ marginTop: '2rem' }}>
      <div className="section-header mb-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>⭐ Ratings & Feedback Audit</h2>
          <p className="text-muted text-sm">Community satisfaction metrics across Donors, NGOs, and Volunteers.</p>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
          Total Reviews: {totalRatings}
        </span>
      </div>

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {/* Card 1: Platform Average */}
        <div className="kpi-card accent-orange">
          <div className="kpi-top">
            <span className="kpi-title">Overall Platform Rating</span>
            <span className="kpi-icon">⭐</span>
          </div>
          <div className="kpi-value">{overallAverage} / 5.0</div>
          <div className="kpi-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <StarRating value={Math.round(overallAverage)} readOnly={true} size="1rem" />
            <span>Based on {totalRatings} reviews</span>
          </div>
        </div>

        {/* Card 2: Role Averages */}
        <div className="kpi-card accent-blue">
          <div className="kpi-top">
            <span className="kpi-title">Satisfaction by Role</span>
            <span className="kpi-icon">👥</span>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>💚 Donor Reviews:</span>
              <strong>{roleAverages?.donorAvg || 0}★ ({roleAverages?.donorCount || 0})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🏢 NGO Reviews:</span>
              <strong>{roleAverages?.ngoAvg || 0}★ ({roleAverages?.ngoCount || 0})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🚴 Volunteer Reviews:</span>
              <strong>{roleAverages?.volunteerAvg || 0}★ ({roleAverages?.volunteerCount || 0})</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Distribution Breakdown */}
        <div className="kpi-card accent-green">
          <div className="kpi-top">
            <span className="kpi-title">Rating Distribution</span>
            <span className="kpi-icon">📊</span>
          </div>
          <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ width: '25px', textAlign: 'right' }}>{star}★</span>
                  <div style={{ flex: 1, background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: '#f59e0b', height: '100%' }} />
                  </div>
                  <span style={{ width: '30px', color: 'var(--text-secondary)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Feedback Table */}
      {recentFeedback && recentFeedback.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Role</th>
                <th>Target User</th>
                <th>Food Item</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentFeedback.slice(0, 10).map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.reviewerId?.name || 'User'}</strong></td>
                  <td><span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{item.reviewerRole}</span></td>
                  <td>{item.targetUserId ? `${item.targetUserId.name} (${item.targetUserId.role})` : 'General'}</td>
                  <td>{item.donationId?.foodName || 'Donation'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <StarRating value={item.rating} readOnly={true} size="0.85rem" />
                      <strong style={{ fontSize: '0.85rem' }}>{item.rating}</strong>
                    </div>
                  </td>
                  <td>
                    {item.comment ? (
                      <span style={{ fontSize: '0.85rem' }}>"{item.comment}"</span>
                    ) : (
                      <span className="text-muted text-sm">—</span>
                    )}
                  </td>
                  <td><span className="text-muted text-sm">{formatDateTime(item.createdAt)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackStats;
