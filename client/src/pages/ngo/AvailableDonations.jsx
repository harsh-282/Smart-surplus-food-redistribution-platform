import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import DonationCard from '../../components/common/DonationCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AvailableDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [accepting, setAccepting] = useState(null);
  const [message, setMessage] = useState('');

  const CATEGORIES = ['All', 'Cooked Food', 'Raw Vegetables', 'Fruits', 'Packaged Food', 'Bakery', 'Dairy', 'Beverages', 'Other'];

  const fetchDonations = () => {
    setLoading(true);
    let url = '/donations?status=Available';
    if (category !== 'All') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    api.get(url)
      .then(res => setDonations(res.data.donations))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonations();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDonations();
  };

  const handleAccept = async (id) => {
    if (!window.confirm('Are you sure you want to accept this food donation?')) return;
    setAccepting(id);
    setMessage('');
    try {
      await api.put(`/donations/${id}/accept`);
      setMessage('🎉 Donation accepted successfully! You can view it in Accepted Donations.');
      setDonations(prev => prev.filter(d => d._id !== id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept donation.');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Available Donations</h1>
        <p className="page-subtitle">Browse and accept available food donations from nearby donors.</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by food name or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: 160 }}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍲</div>
          <div className="empty-state-title">No food donations available</div>
          <div className="empty-state-desc">There are no donations matching your criteria at this moment. Please check back later.</div>
        </div>
      ) : (
        <div className="grid-3">
          {donations.map(donation => (
            <DonationCard
              key={donation._id}
              donation={donation}
              detailLink={`/ngo/donations/${donation._id}`}
              actionButton={
                <button
                  onClick={() => handleAccept(donation._id)}
                  className="btn btn-primary btn-sm"
                  disabled={accepting === donation._id}
                >
                  {accepting === donation._id ? 'Accepting...' : 'Accept'}
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableDonations;
