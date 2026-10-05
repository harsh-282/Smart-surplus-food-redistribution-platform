import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import NearbyDonationMap from '../../components/ngo/NearbyDonationMap';
import DonationCard from '../../components/common/DonationCard';
import PriorityBadge from '../../components/common/PriorityBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { calculateHaversineDistance, formatDistance, geocodeAddress, openGoogleMapsDirections } from '../../utils/distanceHelper';
import { calculateDonationPriority } from '../../utils/donationPriorityHelper';
import { getTimeRemaining } from '../../utils/expiryHelper';

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

const RADIUS_OPTIONS = [
  { label: 'All Distances', value: 'All' },
  { label: 'Within 5 km', value: '5' },
  { label: 'Within 10 km (Default)', value: '10' },
  { label: 'Within 25 km', value: '25' },
  { label: 'Within 50 km', value: '50' },
];

const EXPIRY_OPTIONS = [
  { label: 'All Active Expiry States', value: 'All' },
  { label: '🟢 Fresh (> 24h)', value: 'Fresh' },
  { label: '⚡ Near Expiry (< 24h)', value: 'Near Expiry' },
];

const PRIORITY_FILTER_OPTIONS = [
  { label: 'All Priorities', value: 'All' },
  { label: '🔴 Critical Priority (90-100)', value: 'CRITICAL' },
  { label: '🟠 High Priority (70-89)', value: 'HIGH' },
  { label: '🟡 Medium Priority (40-69)', value: 'MEDIUM' },
  { label: '🟢 Normal Priority (0-39)', value: 'NORMAL' },
];

const NearbyDonationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [ngoProfile, setNgoProfile] = useState(null);
  const [ngoCoords, setNgoCoords] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [message, setMessage] = useState('');

  // Filter States (Default radius 10 km per requirement)
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [maxRadiusKm, setMaxRadiusKm] = useState('10');
  const [expiryFilter, setExpiryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Fetch NGO Profile & Coords
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/ngo/profile');
        const profileData = res.data?.profile || res.data?.ngo;
        if (profileData) {
          setNgoProfile(profileData);
          const coords = profileData.locationCoordinates || profileData.userId?.locationCoordinates || user?.locationCoordinates;
          const address = profileData.address || profileData.userId?.address || user?.address;

          if (coords?.lat != null && coords?.lng != null) {
            setNgoCoords(coords);
          } else if (address) {
            const geo = await geocodeAddress(address);
            if (geo) setNgoCoords(geo);
          }
        } else if (user?.locationCoordinates?.lat != null) {
          setNgoCoords(user.locationCoordinates);
        } else if (user?.address) {
          const geo = await geocodeAddress(user.address);
          if (geo) setNgoCoords(geo);
        }
      } catch (err) {
        console.warn('Failed to load NGO Profile:', err);
        if (user?.locationCoordinates?.lat != null) {
          setNgoCoords(user.locationCoordinates);
        }
      }
    }
    loadProfile();
  }, [user]);

  // Fetch and Process Available Donations
  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/donations?status=Available');
      const now = Date.now();

      // 1. Strict Expiry Safeguard: Only keep active, non-expired food items
      let rawList = (res.data?.donations || []).filter(
        (d) => new Date(d.expiryDate).getTime() > now
      );

      // 2. Compute Distance & Smart Priority Score for all items
      let processedList = rawList.map((d) => {
        const priorityObj = calculateDonationPriority(d, ngoCoords, ngoProfile);
        return {
          ...d,
          priority: priorityObj,
        };
      });

      // 3. Search Filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        processedList = processedList.filter(
          (d) =>
            d.foodName?.toLowerCase().includes(q) ||
            d.category?.toLowerCase().includes(q) ||
            d.description?.toLowerCase().includes(q) ||
            d.pickupAddress?.toLowerCase().includes(q) ||
            d._id?.toLowerCase().includes(q)
        );
      }

      // 4. Category Filter
      if (category !== 'All') {
        processedList = processedList.filter((d) => d.category === category);
      }

      // 5. Expiry Filter
      if (expiryFilter === 'Fresh') {
        processedList = processedList.filter(
          (d) => new Date(d.expiryDate).getTime() - now > 24 * 60 * 60 * 1000
        );
      } else if (expiryFilter === 'Near Expiry') {
        processedList = processedList.filter((d) => {
          const diff = new Date(d.expiryDate).getTime() - now;
          return diff > 0 && diff <= 24 * 60 * 60 * 1000;
        });
      }

      // 6. Priority Filter
      if (priorityFilter !== 'All') {
        processedList = processedList.filter((d) => d.priority.level === priorityFilter);
      }

      // 7. Distance Radius Filter (Only filter out if coords are valid and exceed maxRadius)
      if (maxRadiusKm !== 'All' && ngoCoords?.lat != null) {
        const radiusNum = parseFloat(maxRadiusKm);
        processedList = processedList.filter((d) => {
          if (d.priority.distanceKm == null) return true; // Keep items with missing coords so data isn't lost
          return d.priority.distanceKm <= radiusNum;
        });
      }

      // Sort by highest priority score descending
      processedList.sort((a, b) => b.priority.score - a.priority.score);

      setDonations(processedList);
      if (processedList.length > 0 && !selectedDonation) {
        setSelectedDonation(processedList[0]);
      }
    } catch (err) {
      console.error('Failed to fetch nearby donations:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, maxRadiusKm, expiryFilter, priorityFilter, ngoCoords, ngoProfile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDonations();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchDonations]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('All');
    setMaxRadiusKm('10');
    setExpiryFilter('All');
    setPriorityFilter('All');
  };

  const handleClaim = async (donationId, foodName) => {
    const target = donations.find((d) => d._id === donationId);

    // Strict Safeguard: Prevent claiming expired food
    if (target && new Date(target.expiryDate).getTime() <= Date.now()) {
      alert('⚠️ Sorry, this food donation has expired and can no longer be claimed.');
      fetchDonations();
      return;
    }

    if (!window.confirm(`Are you sure you want to claim "${foodName}" for your NGO?`)) {
      return;
    }

    setAccepting(donationId);
    setMessage('');
    try {
      await api.put(`/donations/${donationId}/accept`);
      setMessage(`🎉 Successfully claimed "${foodName}"! You can now coordinate pickup and tracking in Accepted Donations.`);
      setDonations((prev) => prev.filter((d) => d._id !== donationId));
      if (selectedDonation?._id === donationId) {
        setSelectedDonation(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim donation.');
      fetchDonations();
    } finally {
      setAccepting(null);
    }
  };

  const hasActiveFilters =
    search !== '' ||
    category !== 'All' ||
    maxRadiusKm !== '10' ||
    expiryFilter !== 'All' ||
    priorityFilter !== 'All';

  return (
    <div className="nearby-donations-page">
      <div className="page-header">
        <h1 className="page-title">🗺️ Nearby Food Donations Map</h1>
        <p className="page-subtitle">
          Visually discover available surplus food donations around your NGO location for instant redistribution.
        </p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      {/* Missing Location Alert Banner */}
      {!ngoCoords && !loading && (
        <div className="detail-expiry-alert soon" style={{ marginBottom: '1.5rem', background: 'rgba(234, 88, 12, 0.1)', borderColor: 'rgba(234, 88, 12, 0.4)' }}>
          <span>📍</span>
          <div style={{ flex: 1 }}>
            <strong>NGO Location Unavailable:</strong> Your registered office location is not set. Please update your address or location in your NGO Profile to calculate exact nearby distances.
          </div>
          <Link to="/ngo/profile" className="btn btn-primary btn-sm" style={{ alignSelf: 'center' }}>
            Update Location
          </Link>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="advanced-filter-card" style={{ marginBottom: '1.25rem' }}>
        <div className="filter-grid">
          {/* 1. Search Box */}
          <div className="filter-group flex-2">
            <label className="filter-label">🔍 Search Food Name or Location</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title, location, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 2. Radius Filter */}
          <div className="filter-group">
            <label className="filter-label">🛣️ Radius Filter</label>
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

          {/* 3. Category Filter */}
          <div className="filter-group">
            <label className="filter-label">🥗 Category</label>
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

          {/* 4. Priority Filter */}
          <div className="filter-group">
            <label className="filter-label">🎯 Priority Tier</label>
            <select
              className="form-control"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              {PRIORITY_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Expiry Filter */}
          <div className="filter-group">
            <label className="filter-label">⏳ Expiry Status</label>
            <select
              className="form-control"
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Row & View Mode Toggle */}
        <div className="filter-controls-row" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          {/* View Mode Toggle: Map vs List */}
          <div className="view-mode-toggle" style={{ display: 'inline-flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('map')}
              style={{ border: 'none', borderRadius: '6px' }}
            >
              🗺️ Map View
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
              style={{ border: 'none', borderRadius: '6px' }}
            >
              ☷ List View ({donations.length})
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearFilters}
              >
                ✕ Reset Filters
              </button>
            )}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Found <strong>{donations.length}</strong> nearby items
            </span>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <LoadingSpinner />
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗺️</div>
          <div className="empty-state-title">No Nearby Food Donations Found</div>
          <div className="empty-state-desc">
            {hasActiveFilters
              ? 'No active surplus food items matched your selected filters or radius limit. Try expanding your radius or resetting filters.'
              : 'There are currently no available food donations in your nearby area. Expired items are automatically filtered out.'}
          </div>
          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'map' ? (
        /* MAP VIEW MODE */
        <div className="map-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Map Display */}
          <NearbyDonationMap
            donations={donations}
            ngoCoords={ngoCoords}
            selectedDonation={selectedDonation}
            onSelectDonation={setSelectedDonation}
          />

          {/* Selected Donation Information Popup/Card */}
          {selectedDonation ? (
            <div className="card selected-donation-card" style={{ borderLeft: '4px solid var(--orange-500)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{selectedDonation.foodName}</h2>
                    <span className="badge badge-secondary">📂 {selectedDonation.category}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>
                    📍 Pickup Address: {selectedDonation.pickupAddress}
                  </p>
                </div>
                <PriorityBadge priority={selectedDonation.priority} size="md" />
              </div>

              {/* Key Quick Specs */}
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.6rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div><strong>⚖️ Quantity:</strong> {selectedDonation.quantity}</div>
                <div><strong>📍 Distance:</strong> {formatDistance(selectedDonation.priority?.distanceKm)}</div>
                <div><strong>⏳ Expiry:</strong> {getTimeRemaining(selectedDonation.expiryDate)}</div>
                {selectedDonation.priority?.isPreferenceMatch && (
                  <div style={{ color: '#60a5fa', fontWeight: 600 }}>⭐ NGO Category Match</div>
                )}
              </div>

              {/* Quick Reasons Preview */}
              {selectedDonation.priority?.reasons?.length > 0 && (
                <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Priority Reasons:</strong> {selectedDonation.priority.reasons.slice(0, 3).join(' • ')}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => handleClaim(selectedDonation._id, selectedDonation.foodName)}
                  className="btn btn-primary"
                  disabled={accepting === selectedDonation._id}
                >
                  {accepting === selectedDonation._id ? 'Claiming...' : '🤝 Claim Food'}
                </button>

                <Link to={`/ngo/donations/${selectedDonation._id}`} className="btn btn-secondary">
                  🔍 View Details
                </Link>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    openGoogleMapsDirections(
                      ngoCoords,
                      selectedDonation.pickupCoordinates || selectedDonation.donorId?.locationCoordinates || selectedDonation.pickupAddress
                    )
                  }
                >
                  🗺️ Get Directions
                </button>
              </div>
            </div>
          ) : (
            <div className="alert alert-info" style={{ margin: 0 }}>
              💡 Click any donation marker on the map to inspect its details, score, and claim it.
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW MODE */
        <div className="grid-3">
          {donations.map((donation) => (
            <DonationCard
              key={donation._id}
              donation={donation}
              showPriority={true}
              ngoCoords={ngoCoords}
              ngoProfile={ngoProfile}
              priority={donation.priority}
              detailLink={`/ngo/donations/${donation._id}`}
              actionButton={
                <button
                  onClick={() => handleClaim(donation._id, donation.foodName)}
                  className="btn btn-primary btn-sm"
                  disabled={accepting === donation._id}
                >
                  {accepting === donation._id ? 'Claiming...' : 'Claim'}
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyDonationsPage;
