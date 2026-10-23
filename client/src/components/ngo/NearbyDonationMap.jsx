import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PriorityBadge from '../common/PriorityBadge';
import { formatDistance, getNavigationUrl } from '../../utils/distanceHelper';
import { getTimeRemaining } from '../../utils/expiryHelper';

const PRIORITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  NORMAL: '#22c55e',
};

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
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersLayerRef = useRef(null);
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

  // -------------------------------------------------------------
  // LEAFLET OPENSTREETMAP INITIALIZATION (100% Free, Zero Charges)
  // -------------------------------------------------------------
  useEffect(() => {
    if (useGoogleMaps) return;
    if (!leafletContainerRef.current) return;
    if (leafletMapRef.current) return;

    const centerLat = ngoCoords?.lat ? Number(ngoCoords.lat) : 13.0827;
    const centerLng = ngoCoords?.lng ? Number(ngoCoords.lng) : 80.2707;

    const map = L.map(leafletContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.featureGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [useGoogleMaps]);

  // Update Leaflet Markers whenever filtered donations or ngoCoords change
  useEffect(() => {
    if (useGoogleMaps || !leafletMapRef.current || !markersLayerRef.current) return;

    const map = leafletMapRef.current;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. NGO Base Location Pin (Blue)
    if (ngoCoords && ngoCoords.lat != null && ngoCoords.lng != null) {
      const ngoLatLng = [Number(ngoCoords.lat), Number(ngoCoords.lng)];
      const ngoIcon = L.divIcon({
        className: 'ngo-marker-icon',
        html: `
          <div style="
            background: #2563eb;
            color: #ffffff;
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(37,99,235,0.45);
          ">
            <span style="transform: rotate(45deg); font-size: 16px;">🏢</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const ngoMarker = L.marker(ngoLatLng, { icon: ngoIcon });
      ngoMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; min-width: 150px; line-height: 1.4;">
          <div style="font-weight: 800; color: #1e3a8a; font-size: 14px; margin-bottom: 2px;">🔵 Your NGO Base</div>
          <div style="color: #64748b; font-size: 12px;">Central distribution location</div>
        </div>
      `);
      layer.addLayer(ngoMarker);
      bounds.extend(ngoLatLng);
    }

    // 2. Filtered Available Donation Pins (Color-coded by Urgency)
    donations.forEach((d) => {
      const coords = d.pickupCoordinates || d.donorId?.locationCoordinates;
      if (!coords || coords.lat == null || coords.lng == null) return;

      const lat = Number(coords.lat);
      const lng = Number(coords.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const level = d.priority?.level || 'NORMAL';
      const color = PRIORITY_COLORS[level] || PRIORITY_COLORS.NORMAL;
      const distanceStr = formatDistance(d.priority?.distanceKm) || 'Nearby';
      const expiryStr = getTimeRemaining(d.expiryDate);
      const directionsUrl = getNavigationUrl(ngoCoords || { lat, lng }, coords || d.pickupAddress);

      const donationIcon = L.divIcon({
        className: `donation-marker-${level.toLowerCase()}`,
        html: `
          <div style="
            background: ${color};
            color: #ffffff;
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <span style="transform: rotate(45deg); font-size: 14px;">🍲</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([lat, lng], { icon: donationIcon });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.45; min-width: 210px; max-width: 260px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
            <a id="view-map-title-${d._id}" href="/ngo/donations/${d._id}" style="
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
              text-transform: capitalize;
              text-decoration: none;
              cursor: pointer;
            " title="Click to view donation details">${d.foodName} ↗</a>
            <span style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${d.category || 'Food'}</span>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: ${color}; margin-bottom: 6px;">
            ● ${d.priority?.label || 'Available Item'}
          </div>
          <div style="background: #f8fafc; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; font-size: 12px; color: #334155;">
            <div style="margin-bottom: 3px;">📍 <strong>Distance:</strong> <span style="color: #2563eb; font-weight: 700;">${distanceStr}</span></div>
            <div style="margin-bottom: 3px;">⚖️ <strong>Quantity:</strong> ${d.quantity || 'Available'}</div>
            <div>⏳ <strong>Expiry:</strong> ${expiryStr}</div>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="
              flex: 1;
              background: #174D38;
              color: #ffffff !important;
              text-decoration: none;
              padding: 6px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              text-align: center;
              display: inline-block;
            ">🗺️ Directions</a>
            <a id="view-map-btn-${d._id}" href="/ngo/donations/${d._id}" style="
              flex: 1;
              background: #55A630;
              color: #ffffff !important;
              text-decoration: none;
              padding: 6px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              text-align: center;
              display: inline-block;
            ">👁️ View Donation</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        onSelectDonation(d);
        const btn = document.getElementById(`view-map-btn-${d._id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
            navigate(`/ngo/donations/${d._id}`);
          };
        }
        const titleLink = document.getElementById(`view-map-title-${d._id}`);
        if (titleLink) {
          titleLink.onclick = (e) => {
            e.preventDefault();
            navigate(`/ngo/donations/${d._id}`);
          };
        }
      });

      marker.on('click', () => {
        onSelectDonation(d);
      });

      layer.addLayer(marker);
      bounds.extend([lat, lng]);
    });

    // Auto-fit map to show all filtered pins
    if (bounds.isValid() && layer.getLayers().length > 0) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
    } else if (ngoCoords?.lat != null) {
      map.setView([Number(ngoCoords.lat), Number(ngoCoords.lng)], 12);
    }
  }, [useGoogleMaps, ngoCoords, donations]);

  // Center on selected donation in Leaflet
  useEffect(() => {
    if (useGoogleMaps || !leafletMapRef.current || !selectedDonation) return;
    const coords = selectedDonation.pickupCoordinates || selectedDonation.donorId?.locationCoordinates;
    if (coords && coords.lat != null && coords.lng != null) {
      leafletMapRef.current.panTo([Number(coords.lat), Number(coords.lng)], { animate: true, duration: 0.5 });
    }
  }, [useGoogleMaps, selectedDonation]);

  // -------------------------------------------------------------
  // GOOGLE MAPS API FALLBACK (When paid API key is explicitly supplied)
  // -------------------------------------------------------------
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

  // Center on selected donation in Google Maps
  useEffect(() => {
    if (!useGoogleMaps || !googleMapObj.current || !selectedDonation) return;
    const coords = selectedDonation.pickupCoordinates || selectedDonation.donorId?.locationCoordinates;
    if (coords && coords.lat != null && coords.lng != null) {
      googleMapObj.current.panTo({ lat: Number(coords.lat), lng: Number(coords.lng) });
      googleMapObj.current.setZoom(14);
    }
  }, [useGoogleMaps, selectedDonation]);

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
      {useGoogleMaps ? (
        <div ref={mapRef} style={{ width: '100%', height }} />
      ) : (
        <div style={{ position: 'relative', width: '100%', height }}>
          {/* Interactive Leaflet OpenStreetMap Canvas */}
          <div ref={leafletContainerRef} style={{ width: '100%', height }} />

          {/* Overlay Interactive Markers Layer */}
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
              justifyContent: 'space-between',
              gap: '0.5rem',
              flexWrap: 'wrap',
              zIndex: 1000,
              pointerEvents: 'none',
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
          justifyContent: 'space-between',
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
