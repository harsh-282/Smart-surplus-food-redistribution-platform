/**
 * Distance calculation and Navigation helper utilities for FoodShare
 */

// In-memory cache to prevent duplicate geocoding API requests
const geocodeCache = new Map();

/**
 * Haversine formula to calculate great-circle distance between two (lat, lng) points in kilometers.
 */
/**
 * Haversine formula to calculate great-circle distance between two (lat, lng) points in kilometers.
 * Handles string vs number coordinate values, null/undefined, out-of-bounds inputs.
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const parseCoord = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    if (isNaN(num) || !isFinite(num)) return null;
    return num;
  };

  const pLat1 = parseCoord(lat1);
  const pLon1 = parseCoord(lon1);
  const pLat2 = parseCoord(lat2);
  const pLon2 = parseCoord(lon2);

  if (pLat1 === null || pLon1 === null || pLat2 === null || pLon2 === null) {
    return null;
  }

  // Validate geographical coordinate bounds
  if (Math.abs(pLat1) > 90 || Math.abs(pLat2) > 90 || Math.abs(pLon1) > 180 || Math.abs(pLon2) > 180) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((pLat2 - pLat1) * Math.PI) / 180;
  const dLon = ((pLon2 - pLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pLat1 * Math.PI) / 180) *
      Math.cos((pLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  if (isNaN(distance) || !isFinite(distance) || distance < 0) {
    return null;
  }

  return Math.round(distance * 10) / 10;
};

/**
 * Format distance value into human-readable string.
 * Never outputs NaN, null, undefined, or Infinity.
 */
export const formatDistance = (distKm) => {
  if (distKm === null || distKm === undefined || isNaN(distKm) || !isFinite(distKm) || distKm < 0) {
    return 'Distance unavailable';
  }
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
};

/**
 * Build Google Maps Driving Directions URL between origin and destination.
 */
export const getNavigationUrl = (origin, destination) => {
  const formatLocStr = (loc) => {
    if (!loc) return null;
    if (typeof loc === 'object' && loc.lat != null && loc.lng != null) {
      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        return `${lat},${lng}`;
      }
    }
    if (typeof loc === 'string' && loc.trim()) {
      return encodeURIComponent(loc.trim());
    }
    return null;
  };

  const originStr = formatLocStr(origin);
  const destStr = formatLocStr(destination);

  if (!destStr && !originStr) return null;

  if (!originStr) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destStr}&travelmode=driving`;
  }

  if (!destStr) {
    return `https://www.google.com/maps/dir/?api=1&destination=${originStr}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`;
};

/**
 * Launch Google Maps Driving Directions in app/browser with optional live device GPS as origin
 */
export const openGoogleMapsDirections = (pickupLoc, destLoc) => {
  const launch = (originCoords) => {
    const url = getNavigationUrl(originCoords || pickupLoc, destLoc || pickupLoc);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        launch({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        launch(null);
      },
      { timeout: 5000, maximumAge: 30000 }
    );
  } else {
    launch(null);
  }
};

/**
 * Smart multi-stage geocoding lookup using OpenStreetMap Nominatim with local caching
 */
export const geocodeAddress = async (address) => {
  if (!address || typeof address !== 'string' || !address.trim()) return null;

  const raw = address.trim();
  const cacheKey = raw.toLowerCase();

  // Return from in-memory cache if available
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  // Return from browser localStorage cache if available
  try {
    const cached = localStorage.getItem(`geo_${cacheKey}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        geocodeCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage quota/security errors
  }

  // Build query variants from specific to broad locality fallback
  const variants = [raw];

  // Variant 2: Strip leading door numbers / house numbers or hall/building prefixes
  // e.g. "45, T. Nagar, Chennai, Tamil Nadu" -> "T. Nagar, Chennai, Tamil Nadu"
  const strippedDoor = raw.replace(/^(\d+[\w\s/-]*|\b[\w\s]+(?:hall|building|plaza|centre|center|apartments|villas|house|flat|no|door)\b),?\s*/i, '');
  if (strippedDoor && strippedDoor.length > 3 && strippedDoor !== raw) {
    variants.push(strippedDoor);
  }

  // Variant 3: Strip leading digits & punctuation
  const strippedDigits = raw.replace(/^[\d\s,#/-]+/, '');
  if (strippedDigits && strippedDigits.length > 3 && !variants.includes(strippedDigits)) {
    variants.push(strippedDigits);
  }

  // Variant 4: Extract locality & city (last 2-3 parts)
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length > 2) {
    const subQuery = parts.slice(-3).join(', ');
    if (!variants.includes(subQuery)) variants.push(subQuery);
  } else if (parts.length > 1) {
    const subQuery = parts.slice(-2).join(', ');
    if (!variants.includes(subQuery)) variants.push(subQuery);
  }

  for (const query of variants) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&email=dev@foodshare.org&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
          // Cache successful result
          geocodeCache.set(cacheKey, coords);
          try {
            localStorage.setItem(`geo_${cacheKey}`, JSON.stringify(coords));
          } catch (e) {}
          return coords;
        }
      }
    } catch (err) {
      console.warn('Geocoding query variant failed:', query, err);
    }
  }

  return null;
};
