import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const AssignedDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');

  useEffect(() => {
    api.get('/volunteer/deliveries')
      .then(res => setDeliveries(res.data.deliveries))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getFilteredDeliveries = () => {
    if (filter === 'Active') {
      return deliveries.filter(d => ['Pickup Assigned', 'Picked Up', 'Delivered'].includes(d.status));
    }
    if (filter === 'Completed') {
      return deliveries.filter(d => d.status === 'Completed');
    }
    return deliveries; // All
  };

  if (loading) return <LoadingSpinner />;

  const list = getFilteredDeliveries();

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Assigned Deliveries</h1>
          <p className="page-subtitle">Track, pickup, and complete your assigned redistribution tasks.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilter('Active')}
            className={`btn btn-sm ${filter === 'Active' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('Completed')}
            className={`btn btn-sm ${filter === 'Completed' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('All')}
            className={`btn btn-sm ${filter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">No deliveries found</div>
          <div className="empty-state-desc">There are no deliveries matching the selected filter.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Food</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Donor</th>
                <th>NGO</th>
                <th>Expiry & Urgency</th>
                <th>Workflow Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map(d => (
                <tr key={d._id}>
                  <td><strong>{d.foodName}</strong></td>
                  <td>{d.category}</td>
                  <td>{d.quantity}</td>
                  <td>{d.donorId?.name}</td>
                  <td>{d.acceptedBy?.name}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(d.expiryDate)}</span>
                      <ExpiryBadge expiryDate={d.expiryDate} showTime={true} />
                    </div>
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <Link to={`/volunteer/deliveries/${d._id}`} className="btn btn-secondary btn-sm">
                      {['Completed', 'Cancelled'].includes(d.status) ? 'Details' : 'Update'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignedDeliveries;
