import { useState, useEffect } from 'react';
import { calculateHaversineDistance, formatDistance, getNavigationUrl, geocodeAddress, openGoogleMapsDirections } from '../../utils/distanceHelper';

const RouteDistanceCard = ({
  pickupAddress,
  pickupCoords,
  destinationAddress,
  destinationCoords,
  donorName = 'Donor',
  ngoName = 'NGO',
  compact = false,
  showMapModal = true,
}) => {
  const [distanceKm, setDistanceKm] = useState(null);
  const [loadingDistance, setLoadingDistance] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [resolvedPickupCoords, setResolvedPickupCoords] = useState(pickupCoords);
  const [resolvedDestCoords, setResolvedDestCoords] = useState(destinationCoords);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function computeRoute() {
      setLoadingDistance(true);
      setErrorMsg(null);

      const hasPickup = Boolean(pickupAddress || (pickupCoords && pickupCoords.lat != null));
      const hasDest = Boolean(destinationAddress || (destinationCoords && destinationCoords.lat != null));

      if (!hasPickup) {
        if (isMounted) {
          setErrorMsg('Missing pickup location address.');
          setLoadingDistance(false);
        }
        return;
      }

      if (!hasDest) {
        if (isMounted) {
          setErrorMsg('Missing NGO destination location address.');
          setLoadingDistance(false);
        }
        return;
      }

      let pCoords = pickupCoords;
      let dCoords = destinationCoords;

      // Direct calculation if both coordinates exist
      if (pCoords?.lat != null && pCoords?.lng != null && dCoords?.lat != null && dCoords?.lng != null) {
        const dist = calculateHaversineDistance(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
        if (isMounted) {
          setResolvedPickupCoords(pCoords);
          setResolvedDestCoords(dCoords);
          setDistanceKm(dist);
          setLoadingDistance(false);
        }
        return;
      }

      // Fallback: Geocoding lookup via free OpenStreetMap Nominatim
      try {
        if ((!pCoords || pCoords.lat == null) && pickupAddress) {
          pCoords = await geocodeAddress(pickupAddress);
        }
        if ((!dCoords || dCoords.lat == null) && destinationAddress) {
          dCoords = await geocodeAddress(destinationAddress);
        }

        if (pCoords?.lat != null && dCoords?.lat != null) {
          const dist = calculateHaversineDistance(pCoords.lat, pCoords.lng, dCoords.lat, dCoords.lng);
          if (isMounted) {
            setResolvedPickupCoords(pCoords);
            setResolvedDestCoords(dCoords);
            setDistanceKm(dist);
            setLoadingDistance(false);
          }
        } else {
          if (isMounted) {
            setResolvedPickupCoords(pCoords);
            setResolvedDestCoords(dCoords);
            setDistanceKm(null);
            setErrorMsg('Distance pending exact geocoded coordinates. Navigation links ready.');
            setLoadingDistance(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setDistanceKm(null);
          setErrorMsg('Could not compute exact distance. Navigation route is still available.');
          setLoadingDistance(false);
        }
      }
    }

    computeRoute();

    return () => {
      isMounted = false;
    };
  }, [pickupAddress, pickupCoords, destinationAddress, destinationCoords]);

  const navUrl = getNavigationUrl(
    resolvedPickupCoords || pickupAddress,
    resolvedDestCoords || destinationAddress
  );

  const pickupNavUrl = pickupAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddress)}`
    : null;

  const destNavUrl = destinationAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationAddress)}`
    : null;

  if (compact) {
    return (
      <div style={{ padding: '0.75rem', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🛣️ Route Info</span>
          {loadingDistance ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculating...</span>
          ) : distanceKm !== null ? (
            <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              📍 {formatDistance(distanceKm)}
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>Distance unavailable</span>
          )}
        </div>

        <div style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>Pickup ({donorName}): </span>
            <span style={{ color: 'var(--text-secondary)' }}>{pickupAddress || 'Address not specified'}</span>
          </div>
          <div>
            <span style={{ color: '#2563eb', fontWeight: 600 }}>Destination ({ngoName}): </span>
            <span style={{ color: 'var(--text-secondary)' }}>{destinationAddress || 'Address not specified'}</span>
          </div>
        </div>

        {navUrl && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
            >
              🧭 Open Navigation
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: '1rem', border: '1px solid var(--border-color, #e2e8f0)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🚚 Route & Distance Details
        </h3>
        {loadingDistance ? (
          <span className="badge badge-secondary">⌛ Calculating distance...</span>
        ) : distanceKm !== null ? (
          <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '0.4rem 0.75rem', fontWeight: 700 }}>
            📍 Distance: {formatDistance(distanceKm)}
          </span>
        ) : (
          <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>
            ⚠️ Distance unavailable
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="alert alert-warning" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          ℹ️ {errorMsg}
        </div>
      )}

      {/* Visual Route Timeline / Step Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Step 1: Pickup */}
        <div style={{ padding: '1rem', background: 'rgba(22, 163, 74, 0.06)', borderRadius: '10px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📍</span>
            <strong style={{ color: '#16a34a' }}>Pickup Location</strong>
          </div>
          <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>{donorName}</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0', wordBreak: 'break-word' }}>
            {pickupAddress || 'No pickup address specified'}
          </p>
          {pickupNavUrl && (
            <a
              href={pickupNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              🗺️ Open Pickup Location
            </a>
          )}
        </div>

        {/* Step 2: Destination */}
        <div style={{ padding: '1rem', background: 'rgba(37, 99, 235, 0.06)', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏢</span>
            <strong style={{ color: '#2563eb' }}>Destination (NGO)</strong>
          </div>
          <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>{ngoName}</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0', wordBreak: 'break-word' }}>
            {destinationAddress || 'No NGO address specified'}
          </p>
          {destNavUrl && (
            <a
              href={destNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              🗺️ Open NGO Location
            </a>
          )}
        </div>
      </div>

      {/* Navigation and View Route Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {navUrl ? (
          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              openGoogleMapsDirections(
                resolvedPickupCoords || pickupAddress,
                resolvedDestCoords || destinationAddress
              );
            }}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minHeight: '44px' }}
          >
            🧭 Open Navigation
          </a>
        ) : (
          <button className="btn btn-primary" disabled style={{ opacity: 0.6, minHeight: '44px' }}>
            🧭 Open Navigation (Address missing)
          </button>
        )}

        {showMapModal && (
          <button
            onClick={() => setShowMap(!showMap)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            🗺️ {showMap ? 'Hide Map Preview' : 'View Route'}
          </button>
        )}
      </div>

      {/* OpenStreetMap Preview Map */}
      {showMap && (
        <div style={{ marginTop: '1rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color, #cbd5e1)' }}>
          <iframe
            title="Route Map Preview"
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${
              resolvedPickupCoords && resolvedDestCoords
                ? `${Math.min(resolvedPickupCoords.lng, resolvedDestCoords.lng) - 0.03},${Math.min(resolvedPickupCoords.lat, resolvedDestCoords.lat) - 0.03},${Math.max(resolvedPickupCoords.lng, resolvedDestCoords.lng) + 0.03},${Math.max(resolvedPickupCoords.lat, resolvedDestCoords.lat) + 0.03}`
                : '77.5,12.9,77.7,13.1'
            }&layer=mapnik&marker=${resolvedPickupCoords ? `${resolvedPickupCoords.lat},${resolvedPickupCoords.lng}` : ''}`}
          />
          <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary, #f1f5f9)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            🌍 OpenStreetMap Preview. Click <strong>Open Navigation</strong> for turn-by-turn routing.
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteDistanceCard;
