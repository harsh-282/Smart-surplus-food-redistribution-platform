import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [cancelling, setCancelling] = useState(null);

  const STATUSES = ['All', 'Available', 'Accepted', 'Pickup Assigned', 'Picked Up', 'Delivered', 'Completed', 'Cancelled'];

  useEffect(() => {
    api.get('/donations/my')
      .then(res => { setDonations(res.data.donations); setFiltered(res.data.donations); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = donations;
    if (statusFilter !== 'All') list = list.filter(d => d.status === statusFilter);
    if (search) list = list.filter(d => d.foodName.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [statusFilter, search, donations]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this donation?')) return;
    setCancelling(id);
    try {
      await api.put(`/donations/${id}/cancel`);
      setDonations(prev => prev.map(d => d._id === id ? { ...d, status: 'Cancelled' } : d));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel.');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">My Donations</h1>
          <p className="page-subtitle">{donations.length} total donations</p>
        </div>
        <Link to="/donor/add-donation" className="btn btn-primary">➕ Add New</Link>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input type="text" className="form-control search-input" placeholder="Search by food name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No donations found</div>
          <div className="empty-state-desc">Try changing filters or post a new donation.</div>
          <Link to="/donor/add-donation" className="btn btn-primary">Add Donation</Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Food</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Expiry</th>
                <th>Accepted By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d._id}>
                  <td>
                    {d.image?.url && <img src={d.image.url} alt={d.foodName} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', marginRight: 8, verticalAlign: 'middle' }} />}
                    <strong>{d.foodName}</strong>
                  </td>
                  <td>{d.category}</td>
                  <td>{d.quantity}</td>
                  <td>{formatDate(d.expiryDate)}</td>
                  <td>{d.acceptedBy?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Link to={`/donor/donations/${d._id}`} className="btn btn-secondary btn-sm">View</Link>
                      {['Available', 'Accepted'].includes(d.status) && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(d._id)}
                          disabled={cancelling === d._id}
                        >
                          {cancelling === d._id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </div>
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

export default MyDonations;
