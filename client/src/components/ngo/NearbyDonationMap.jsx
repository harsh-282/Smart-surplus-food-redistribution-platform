import { useState, useEffect, useRef } from 'react';
import PriorityBadge from '../common/PriorityBadge';
import { formatDistance, openGoogleMapsDirections } from '../../utils/distanceHelper';
import { getTimeRemaining } from '../../utils/expiryHelper';

const PRIORITY_MARKER_ICONS = {
  CRITICAL: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  HIGH: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  MEDIUM: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  NORMAL: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
};

const NearbyDonationMap = ({
  donations = [],
  ngoCoords = null,
  selectedDonation = null,
  onSelectDonation = () => {},
  height = 'clamp(320px, 50vh, 500px)',
}) => {
  const mapRef = useRef(null);
  const googleMapObj = useRef(null);
  const markersRef = useRef([]);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Check Google Maps API Key validity
  useEffect(() => {
    if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && apiKey.length > 15) {
      setUseGoogleMaps(true);
    } else {
      setUseGoogleMaps(false);
    }
  }, [apiKey]);

  // Initialize and update Google Maps markers
  useEffect(() => {
    if (!useGoogleMaps || !mapRef.current) return;

    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    const scriptId = 'google-maps-js-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', initMap);
    }

    function initMap() {
      if (!mapRef.current || !window.google?.maps) return;

      const center = ngoCoords || { lat: 13.0827, lng: 80.2707 };

      if (!googleMapObj.current) {
        googleMapObj.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: false,
          zoomControl: true,
          fullscreenControl: true,
        });
      }

      const map = googleMapObj.current;
      const bounds = new window.google.maps.LatLngBounds();

      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      // NGO Marker
      if (ngoCoords && ngoCoords.lat != null && ngoCoords.lng != null) {
        const ngoMarker = new window.google.maps.Marker({
          position: ngoCoords,
          map,
          title: '🔵 Your NGO Location',
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          zIndex: 1000,
        });
        bounds.extend(ngoCoords);
        markersRef.current.push(ngoMarker);
      }

      // Donation Markers
      donations.forEach((d) => {
        const coords = d.pickupCoordinates || d.donorId?.locationCoordinates;
        if (!coords || coords.lat == null || coords.lng == null) return;

        const level = d.priority?.level || 'NORMAL';
        const iconUrl = PRIORITY_MARKER_ICONS[level] || PRIORITY_MARKER_ICONS.NORMAL;

        const marker = new window.google.maps.Marker({
          position: { lat: Number(coords.lat), lng: Number(coords.lng) },
          map,
          title: `${d.foodName} (${d.priority?.label || 'Available'})`,
          icon: iconUrl,
        });

        marker.addListener('click', () => {
          onSelectDonation(d);
        });

        bounds.extend({ lat: Number(coords.lat), lng: Number(coords.lng) });
        markersRef.current.push(marker);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    }
  }, [useGoogleMaps, ngoCoords, donations, apiKey]);

  // Center on selected donation when user selects one
  useEffect(() => {
    if (!googleMapObj.current || !selectedDonation) return;
    const coords = selectedDonation.pickupCoordinates || selectedDonation.donorId?.locationCoordinates;
    if (coords && coords.lat != null && coords.lng != null) {
      googleMapObj.current.panTo({ lat: Number(coords.lat), lng: Number(coords.lng) });
      googleMapObj.current.setZoom(14);
    }
  }, [selectedDonation]);

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
      {useGoogleMaps ? (
        <div ref={mapRef} style={{ width: '100%', height }} />
      ) : (
        <div style={{ position: 'relative', width: '100%', height }}>
          {/* Interactive OSM Canvas View */}
          <iframe
            title="Nearby Food Donations Map"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${
              ngoCoords
                ? `${ngoCoords.lng - 0.08},${ngoCoords.lat - 0.08},${ngoCoords.lng + 0.08},${ngoCoords.lat + 0.08}`
                : '77.5,12.9,77.7,13.1'
            }&layer=mapnik${
              ngoCoords ? `&marker=${ngoCoords.lat},${ngoCoords.lng}` : ''
            }`}
          />

          {/* Overlay Interactive Markers Layer for OSM */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              right: '10px',
              background: 'rgba(13, 17, 23, 0.9)',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong>📍 Showing {donations.length} Active Donations</strong>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: '#f87171' }}>🔴 Critical</span>
              <span style={{ color: '#fb923c' }}>🟠 High</span>
              <span style={{ color: '#facc15' }}>🟡 Med</span>
              <span style={{ color: '#4ade80' }}>🟢 Norm</span>
            </div>
          </div>
        </div>
      )}

      {/* Standard Map Legend Footer */}
      <div
        style={{
          padding: '0.6rem 1rem',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Legend:</span>
          <span>🔵 NGO Base</span>
          <span>🔴 Critical (90+)</span>
          <span>🟠 High (70-89)</span>
          <span>🟡 Medium (40-69)</span>
          <span>🟢 Normal (0-39)</span>
        </div>
        <div>
          Showing <strong>{donations.length}</strong> available items
        </div>
      </div>
    </div>
  );
};

export default NearbyDonationMap;
