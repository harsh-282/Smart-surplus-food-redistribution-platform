import { useState, useEffect, useRef } from 'react';
import { geocodeAddress } from '../../utils/distanceHelper';

const GoogleMapView = ({
  pickupAddress,
  pickupCoords,
  destinationAddress,
  destinationCoords,
  volunteerCoords,
  trackingActive = false,
  isStale = false,
  lastUpdatedAt = null,
  height = 'clamp(260px, 45vh, 380px)',
}) => {
  const mapRef = useRef(null);
  const [resolvedPickup, setResolvedPickup] = useState(pickupCoords);
  const [resolvedDest, setResolvedDest] = useState(destinationCoords);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Resolve coordinates for pickup and destination if not explicitly supplied
  useEffect(() => {
    let isMounted = true;

    async function resolveLocations() {
      let pCoords = pickupCoords;
      let dCoords = destinationCoords;

      if ((!pCoords || pCoords.lat == null) && pickupAddress) {
        pCoords = await geocodeAddress(pickupAddress);
      }
      if ((!dCoords || dCoords.lat == null) && destinationAddress) {
        dCoords = await geocodeAddress(destinationAddress);
      }

      if (isMounted) {
        if (pCoords) setResolvedPickup(pCoords);
        if (dCoords) setResolvedDest(dCoords);
      }
    }

    resolveLocations();
    return () => {
      isMounted = false;
    };
  }, [pickupAddress, pickupCoords, destinationAddress, destinationCoords]);

  // Check if valid Google Maps API Key is provided
  useEffect(() => {
    if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && apiKey.length > 15) {
      setUseGoogleMaps(true);
    } else {
      setUseGoogleMaps(false);
    }
  }, [apiKey]);

  // Google Maps JS API Dynamic Loader
  useEffect(() => {
    if (!useGoogleMaps || !mapRef.current) return;

    if (window.google && window.google.maps) {
      initGoogleMap();
      return;
    }

    const scriptId = 'google-maps-js-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => initGoogleMap();
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', initGoogleMap);
    }

    function initGoogleMap() {
      if (!mapRef.current || !window.google?.maps) return;

      const defaultCenter = resolvedPickup || resolvedDest || volunteerCoords || { lat: 13.0827, lng: 80.2707 };
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
      });

      const bounds = new window.google.maps.LatLngBounds();

      // Pickup Marker
      if (resolvedPickup && resolvedPickup.lat != null) {
        const pickupMarker = new window.google.maps.Marker({
          position: resolvedPickup,
          map,
          title: `Pickup: ${pickupAddress || 'Donor'}`,
          icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        });
        bounds.extend(resolvedPickup);
      }

      // Destination Marker
      if (resolvedDest && resolvedDest.lat != null) {
        const destMarker = new window.google.maps.Marker({
          position: resolvedDest,
          map,
          title: `NGO Destination: ${destinationAddress || 'NGO'}`,
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        });
        bounds.extend(resolvedDest);
      }

      // Volunteer Live GPS Marker
      if (volunteerCoords && volunteerCoords.lat != null && trackingActive && !isStale) {
        const volMarker = new window.google.maps.Marker({
          position: volunteerCoords,
          map,
          title: 'Volunteer Current Live Location',
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        });
        bounds.extend(volunteerCoords);
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }

      setMapLoaded(true);
    }
  }, [useGoogleMaps, resolvedPickup, resolvedDest, volunteerCoords, trackingActive, isStale]);

  // Format last updated text
  const getTimeAgo = () => {
    if (!lastUpdatedAt) return 'No updates yet';
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(lastUpdatedAt).getTime()) / 1000));
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  };

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color, #cbd5e1)', marginTop: '1rem' }}>
      {/* Map Header Status Bar */}
      <div
        style={{
          padding: '0.6rem 1rem',
          background: trackingActive && !isStale ? 'rgba(22, 163, 74, 0.1)' : 'var(--bg-secondary, #f1f5f9)',
          borderBottom: '1px solid var(--border-color, #cbd5e1)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>🗺️</span>
          <strong>Delivery Tracking Map ({useGoogleMaps ? 'Google Maps' : 'OpenStreetMap'})</strong>
        </div>

        <div>
          {trackingActive && !isStale ? (
            <span className="badge badge-success" style={{ fontWeight: 700 }}>
              🟢 Live Tracking Active • Last updated {getTimeAgo()}
            </span>
          ) : isStale ? (
            <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
              ⚠️ Location update unavailable ({lastUpdatedAt ? `Last update ${getTimeAgo()}` : 'Tracking inactive'})
            </span>
          ) : (
            <span className="badge badge-secondary" style={{ fontSize: '0.8rem' }}>
              ⏸️ Tracking Idle
            </span>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      {useGoogleMaps ? (
        <div ref={mapRef} style={{ width: '100%', height }} />
      ) : (
        <div style={{ position: 'relative', width: '100%', height }}>
          <iframe
            title="OpenStreetMap Live Delivery Tracking"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${
              resolvedPickup && resolvedDest
                ? `${Math.min(resolvedPickup.lng, resolvedDest.lng, volunteerCoords?.lng || 180) - 0.03},${Math.min(resolvedPickup.lat, resolvedDest.lat, volunteerCoords?.lat || 90) - 0.03},${Math.max(resolvedPickup.lng, resolvedDest.lng, volunteerCoords?.lng || -180) + 0.03},${Math.max(resolvedPickup.lat, resolvedDest.lat, volunteerCoords?.lat || -90) + 0.03}`
                : '77.5,12.9,77.7,13.1'
            }&layer=mapnik&marker=${
              volunteerCoords?.lat != null && trackingActive && !isStale
                ? `${volunteerCoords.lat},${volunteerCoords.lng}`
                : resolvedPickup?.lat != null
                ? `${resolvedPickup.lat},${resolvedPickup.lng}`
                : ''
            }`}
          />
        </div>
      )}

      {/* Map Legend */}
      <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-card, #ffffff)', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ color: '#16a34a' }}>🟢</span> <strong>Pickup (Donor)</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ color: '#2563eb' }}>🏢</span> <strong>Destination (NGO)</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ color: '#dc2626' }}>🚴</span> <strong>Volunteer GPS</strong>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapView;
