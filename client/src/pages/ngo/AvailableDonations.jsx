import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import DonationCard from '../../components/common/DonationCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { calculateHaversineDistance, formatDistance, geocodeAddress } from '../../utils/distanceHelper';

const CATEGORIES = [
  'All',
  'Cooked Food',
  'Raw Vegetables',
  'Fruits',
  'Packaged Food',
  'Bakery',
  'Dairy',
  'Beverages',
  'Other',
];

const EXPIRY_OPTIONS = [
  { label: 'All Active Expiry States', value: 'All' },
  { label: '🟢 Fresh (> 24h)', value: 'Fresh' },
  { label: '⚡ Near Expiry (< 24h)', value: 'Near Expiry' },
];

const RADIUS_OPTIONS = [
  { label: 'All Distances', value: 'All' },
  { label: 'Within 5 km', value: '5' },
  { label: 'Within 10 km', value: '10' },
  { label: 'Within 25 km', value: '25' },
  { label: 'Within 50 km', value: '50' },
];

const AvailableDonations = () => {
  const [donations, setDonations] = useState([]);
  const [ngoProfile, setNgoProfile] = useState(null);
  const [ngoCoords, setNgoCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  // Advanced Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryStatus, setExpiryStatus] = useState('All');
  const [maxRadiusKm, setMaxRadiusKm] = useState('All');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [prefOnly, setPrefOnly] = useState(false);

  const [accepting, setAccepting] = useState(null);
  const [message, setMessage] = useState('');

  // Fetch NGO Profile for category & capacity preferences
  useEffect(() => {
    async function loadNGOProfile() {
      try {
        const res = await api.get('/ngo/profile');
        if (res.data?.ngo) {
          setNgoProfile(res.data.ngo);
          const coords = res.data.ngo.locationCoordinates || res.data.ngo.userId?.locationCoordinates;
          if (coords?.lat != null && coords?.lng != null) {
            setNgoCoords(coords);
          } else if (res.data.ngo.address) {
            const geo = await geocodeAddress(res.data.ngo.address);
            if (geo) setNgoCoords(geo);
          }
        }
      } catch (err) {
        console.warn('NGO profile load failed:', err);
      }
    }
    loadNGOProfile();
  }, []);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ status: 'Available' });

      if (category && category !== 'All') {
        queryParams.append('category', category);
      }
      if (search.trim()) {
        queryParams.append('search', search.trim());
      }
      if (location.trim()) {
        queryParams.append('location', location.trim());
      }
      if (quantity.trim()) {
        queryParams.append('quantity', quantity.trim());
      }
      if (expiryStatus && expiryStatus !== 'All') {
        queryParams.append('expiryStatus', expiryStatus);
      }
      if (urgentOnly) {
        queryParams.append('urgentOnly', 'true');
      }

      const res = await api.get(`/donations?${queryParams.toString()}`);

      // STRICT BACKEND & FRONTEND SAFEGUARD:
      // Filter out any expired food items (expiryDate <= Date.now())
      const now = Date.now();
      let validList = (res.data?.donations || []).filter(
        (d) => new Date(d.expiryDate).getTime() > now
      );

      // Distance Radius Filtering if specified
      if (maxRadiusKm !== 'All' && ngoCoords?.lat != null) {
        const limitKm = parseFloat(maxRadiusKm);
        validList = validList.filter((d) => {
          const dCoords = d.pickupCoordinates || d.donorId?.locationCoordinates;
          if (dCoords?.lat != null && dCoords?.lng != null) {
            const dist = calculateHaversineDistance(ngoCoords.lat, ngoCoords.lng, dCoords.lat, dCoords.lng);
            return dist === null || dist <= limitKm;
          }
          return true; // Keep donations with missing coords so valid items aren't lost
        });
      }

      // NGO Preferred Categories Filter if toggled
      if (prefOnly && ngoProfile?.acceptedCategories?.length > 0) {
        const prefs = ngoProfile.acceptedCategories;
        if (!prefs.includes('All')) {
          validList = validList.filter((d) => prefs.includes(d.category));
        }
      }

      setDonations(validList);
    } catch (err) {
      console.error('Failed to fetch available donations:', err);
    } finally {
      setLoading(false);
    }
  }, [category, search, location, quantity, expiryStatus, urgentOnly, maxRadiusKm, prefOnly, ngoCoords, ngoProfile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDonations();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchDonations]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDonations();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('All');
    setLocation('');
    setQuantity('');
    setExpiryStatus('All');
    setMaxRadiusKm('All');
    setUrgentOnly(false);
    setPrefOnly(false);
  };

  const handleAccept = async (id, foodName) => {
    const target = donations.find((d) => d._id === id);

    // Business & Security Protection: Prevent accepting expired food
    if (target && new Date(target.expiryDate).getTime() <= Date.now()) {
      alert('⚠️ Sorry, this food donation has expired and can no longer be accepted.');
      fetchDonations();
      return;
    }

    if (!window.confirm(`Are you sure you want to accept "${foodName}" for your NGO?`)) {
      return;
    }

    setAccepting(id);
    setMessage('');
    try {
      await api.put(`/donations/${id}/accept`);
      setMessage(`🎉 Successfully accepted "${foodName}"! You can now view and track it in Accepted Donations.`);
      setDonations((prev) => prev.filter((d) => d._id !== id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept donation.');
      fetchDonations();
    } finally {
      setAccepting(null);
    }
  };

  const expiringSoonCount = donations.filter((d) => {
    const diff = new Date(d.expiryDate).getTime() - Date.now();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  }).length;

  const hasActiveFilters =
    search !== '' ||
    category !== 'All' ||
    location !== '' ||
    quantity !== '' ||
    expiryStatus !== 'All' ||
    maxRadiusKm !== 'All' ||
    urgentOnly ||
    prefOnly;

  return (
    <div className="available-donations-page">
      <div className="page-header">
        <h1 className="page-title">Available Food Donations</h1>
        <p className="page-subtitle">
          Browse, filter, and manually review available fresh surplus food donations for NGO redistribution.
        </p>
      </div>

      {/* Near-Expiry Warning Banner */}
      {expiringSoonCount > 0 && (
        <div className="detail-expiry-alert soon" style={{ marginBottom: '1.5rem' }}>
          <span>⚡</span>
          <div>
            <strong>High Priority:</strong> {expiringSoonCount}{' '}
            {expiringSoonCount === 1 ? 'donation is' : 'donations are'}{' '}
            <strong>Expiring Soon</strong> (&lt; 24 hours). Please review and claim them promptly!
          </div>
        </div>
      )}

      {message && <div className="alert alert-success">{message}</div>}

      {/* Advanced Search & Visibility Filter Section */}
      <div className="advanced-filter-card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div className="filter-grid">
            {/* 1. Food Name / General Search */}
            <div className="filter-group flex-2">
              <label className="filter-label">🔍 Search Food Name or Description</label>
              <div className="search-input-wrap">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="e.g. Fresh Rice, Bread, Veg Curry..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* 2. Category Dropdown */}
            <div className="filter-group">
              <label className="filter-label">🥗 Food Category</label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Location Search */}
            <div className="filter-group">
              <label className="filter-label">📍 Pickup Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. City, Street, Area..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* 4. Distance Radius Filter */}
            <div className="filter-group">
              <label className="filter-label">🛣️ Distance Radius</label>
              <select
                className="form-control"
                value={maxRadiusKm}
                onChange={(e) => setMaxRadiusKm(e.target.value)}
              >
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Expiry Status Filter */}
            <div className="filter-group">
              <label className="filter-label">⏳ Expiry Status</label>
              <select
                className="form-control"
                value={expiryStatus}
                onChange={(e) => setExpiryStatus(e.target.value)}
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Bar Controls & Quick Toggles */}
          <div className="filter-controls-row">
            <div className="filter-toggles">
              <button
                type="button"
                className={`urgent-toggle-btn ${urgentOnly ? 'active' : ''}`}
                onClick={() => setUrgentOnly((prev) => !prev)}
              >
                ⚡ Near Expiry (&lt; 24h) {urgentOnly ? '✓' : ''}
              </button>

              {ngoProfile?.acceptedCategories?.length > 0 && (
                <button
                  type="button"
                  className={`urgent-toggle-btn ${prefOnly ? 'active' : ''}`}
                  onClick={() => setPrefOnly((prev) => !prev)}
                  style={{ borderColor: '#2563eb', color: prefOnly ? '#ffffff' : '#2563eb', background: prefOnly ? '#2563eb' : 'transparent' }}
                >
                  ⭐ NGO Preferred Categories {prefOnly ? '✓' : ''}
                </button>
              )}
            </div>

            <div className="filter-action-buttons">
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClearFilters}
                >
                  ✕ Clear All Filters
                </button>
              )}
              <button type="submit" className="btn btn-primary btn-sm">
                Apply Search
              </button>
            </div>
          </div>
        </form>

        {/* Active Applied Filter Badges */}
        {hasActiveFilters && (
          <div className="active-filter-pills">
            <span className="pills-label">Active Visibility Filters:</span>
            {search && <span className="filter-pill">Name: "{search}"</span>}
            {category !== 'All' && <span className="filter-pill">Category: {category}</span>}
            {location && <span className="filter-pill">Location: "{location}"</span>}
            {maxRadiusKm !== 'All' && <span className="filter-pill">Radius: &lt; {maxRadiusKm} km</span>}
            {expiryStatus !== 'All' && <span className="filter-pill">Expiry: {expiryStatus}</span>}
            {urgentOnly && <span className="filter-pill urgent">⚡ Near Expiry (&lt; 24h)</span>}
            {prefOnly && <span className="filter-pill">⭐ Category Preferences</span>}
          </div>
        )}
      </div>

      {/* Results Content Area */}
      {loading ? (
        <LoadingSpinner />
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No Suitable Food Donations Found</div>
          <div className="empty-state-desc">
            {hasActiveFilters
              ? 'No available surplus food items matched your search & location criteria. Try adjusting or clearing your filters.'
              : 'There are no active available food donations listed at this moment. Expired donations are automatically filtered out.'}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="results-count-bar" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Showing <strong>{donations.length}</strong> valid available food {donations.length === 1 ? 'donation' : 'donations'} (Expired items filtered out)
          </div>

          <div className="grid-3">
            {donations.map((donation) => {
              let distanceKm = null;
              const dCoords = donation.pickupCoordinates || donation.donorId?.locationCoordinates;
              if (ngoCoords?.lat != null && dCoords?.lat != null) {
                distanceKm = calculateHaversineDistance(ngoCoords.lat, ngoCoords.lng, dCoords.lat, dCoords.lng);
              }

              const isPrefMatch = ngoProfile?.acceptedCategories?.includes(donation.category);

              return (
                <div key={donation._id} style={{ position: 'relative' }}>
                  <DonationCard
                    donation={donation}
                    detailLink={`/ngo/donations/${donation._id}`}
                    actionButton={
                      <button
                        onClick={() => handleAccept(donation._id, donation.foodName)}
                        className="btn btn-primary btn-sm"
                        disabled={accepting === donation._id}
                      >
                        {accepting === donation._id ? 'Accepting...' : 'Accept'}
                      </button>
                    }
                  />

                  {/* Distance & Preference Pills Overlay */}
                  <div style={{ marginTop: '-0.5rem', marginBottom: '0.75rem', padding: '0 0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    <span className="badge badge-primary" style={{ fontWeight: 600 }}>
                      📍 {formatDistance(distanceKm)}
                    </span>
                    {isPrefMatch && (
                      <span className="badge badge-success" style={{ fontWeight: 600 }}>
                        ⭐ Category Match
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AvailableDonations;
