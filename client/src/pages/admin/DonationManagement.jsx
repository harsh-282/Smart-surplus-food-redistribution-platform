import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const DonationManagement = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [expiryFilter, setExpiryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const STATUSES = ['All', 'Available', 'Accepted', 'Pickup Assigned', 'Picked Up', 'Delivered', 'Completed', 'Cancelled'];
  const CATEGORIES = ['All', 'Cooked Food', 'Raw Vegetables', 'Fruits', 'Packaged Food', 'Bakery', 'Dairy', 'Beverages', 'Other'];
  const EXPIRY_OPTIONS = ['All', 'Fresh', 'Expiring Soon', 'Expired'];

  const fetchDonations = () => {
    setLoading(true);
    let url = '/admin/donations';
    const params = [];
    if (statusFilter !== 'All') params.push(`status=${statusFilter}`);
    if (categoryFilter !== 'All') params.push(`category=${categoryFilter}`);
    if (expiryFilter !== 'All') params.push(`expiryStatus=${encodeURIComponent(expiryFilter)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    api.get(url)
      .then(res => setDonations(res.data.donations))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonations();
  }, [statusFilter, categoryFilter, expiryFilter]);

  const handleCancelDonation = async (id) => {
    if (!window.confirm('Are you sure you want to flag and cancel this donation?')) return;
    setCancellingId(id);
    try {
      await api.put(`/admin/donations/${id}/cancel`);
      setDonations(prev => prev.map(d => d._id === id ? { ...d, status: 'Cancelled' } : d));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel donation.');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredDonations = donations.filter(d =>
    d.foodName.toLowerCase().includes(search.toLowerCase()) ||
    d.donorId?.name.toLowerCase().includes(search.toLowerCase()) ||
    d.pickupAddress.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Donation Management</h1>
        <p className="page-subtitle">Track, moderate, and monitor food donations across all expiry stages and logistics statuses.</p>
      </div>

      {/* Filters bar */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ flex: 2 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by food name, donor or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {STATUSES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: 140 }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: 140 }}
          value={expiryFilter}
          onChange={e => setExpiryFilter(e.target.value)}
        >
          <option value="All">All Expiry States</option>
          {EXPIRY_OPTIONS.slice(1).map(exp => <option key={exp} value={exp}>{exp}</option>)}
        </select>
      </div>

      {filteredDonations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍲</div>
          <div className="empty-state-title">No donations matched</div>
          <div className="empty-state-desc">Try resetting your search query or filter.</div>
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
                <th>Expiry & Time Left</th>
                <th>Workflow Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map(d => (
                <tr key={d._id}>
                  <td>
                    {d.image?.url && <img src={d.image.url} alt={d.foodName} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', marginRight: 8, verticalAlign: 'middle' }} />}
                    <strong>{d.foodName}</strong>
                  </td>
                  <td>{d.category}</td>
                  <td>{d.quantity}</td>
                  <td>{d.donorId?.name}</td>
                  <td>{d.acceptedBy?.name || <span className="text-muted">—</span>}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(d.expiryDate)}</span>
                      <ExpiryBadge expiryDate={d.expiryDate} showTime={true} />
                    </div>
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Link to={`/admin/donations/${d._id}`} className="btn btn-secondary btn-sm">View</Link>
                      {!['Cancelled', 'Completed', 'Delivered'].includes(d.status) && (
                        <button
                          onClick={() => handleCancelDonation(d._id)}
                          className="btn btn-danger btn-sm"
                          disabled={cancellingId === d._id}
                        >
                          Cancel
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

export default DonationManagement;
