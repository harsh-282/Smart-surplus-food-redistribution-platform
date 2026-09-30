/**
 * Distance calculation and Navigation helper utilities for FoodShare
 */

// In-memory cache to prevent duplicate geocoding API requests
const geocodeCache = new Map();

/**
 * Haversine formula to calculate great-circle distance between two (lat, lng) points in kilometers.
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lat1 === null || isNaN(lat1) ||
    lon1 === undefined || lon1 === null || isNaN(lon1) ||
    lat2 === undefined || lat2 === null || isNaN(lat2) ||
    lon2 === undefined || lon2 === null || isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
};

/**
 * Format distance value into human-readable string.
 */
export const formatDistance = (distKm) => {
  if (distKm === null || distKm === undefined || isNaN(distKm)) {
    return 'Distance unavailable';
  }
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
};

/**
 * Build Google Maps Navigation URL between origin and destination.
 */
export const getNavigationUrl = (origin, destination) => {
  let originStr = '';
  let destStr = '';

  if (origin && typeof origin === 'object' && origin.lat != null && origin.lng != null) {
    originStr = `${origin.lat},${origin.lng}`;
  } else if (typeof origin === 'string' && origin.trim()) {
    originStr = encodeURIComponent(origin.trim());
  }

  if (destination && typeof destination === 'object' && destination.lat != null && destination.lng != null) {
    destStr = `${destination.lat},${destination.lng}`;
  } else if (typeof destination === 'string' && destination.trim()) {
    destStr = encodeURIComponent(destination.trim());
  }

  if (!originStr || !destStr) return null;

  return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`;
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
