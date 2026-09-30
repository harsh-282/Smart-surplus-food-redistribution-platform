/**
 * Transparent Rule-Based Volunteer Scoring & Suitability Engine for FoodShare
 * Note: This is a 100% transparent rule-based algorithm (Not AI/ML).
 */

const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
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
  return Math.round(R * c * 100) / 100;
};

/**
 * Compute transparent suitability score and human-readable breakdown for a candidate volunteer.
 */
const calculateVolunteerSuitability = (volunteer, donation, activeDeliveriesCount = 0) => {
  let score = 0;
  const breakdown = [];
  const maxScore = 100;

  // 1. Availability Score (Max 20 pts)
  const isAvailable = volunteer.availability === 'Available';
  if (isAvailable) {
    score += 20;
    breakdown.push({ factor: 'Availability', points: 20, reason: 'Available status (+20 pts)' });
  } else {
    breakdown.push({ factor: 'Availability', points: 0, reason: `Status is ${volunteer.availability} (+0 pts)` });
  }

  // 2. Workload Score (Max 30 pts)
  let workloadPts = 0;
  if (activeDeliveriesCount === 0) {
    workloadPts = 30;
    breakdown.push({ factor: 'Workload', points: 30, reason: '0 active tasks — optimal availability (+30 pts)' });
  } else if (activeDeliveriesCount === 1) {
    workloadPts = 20;
    breakdown.push({ factor: 'Workload', points: 20, reason: '1 active task — light workload (+20 pts)' });
  } else if (activeDeliveriesCount === 2) {
    workloadPts = 10;
    breakdown.push({ factor: 'Workload', points: 10, reason: '2 active tasks — moderate workload (+10 pts)' });
  } else {
    workloadPts = 0;
    breakdown.push({ factor: 'Workload', points: 0, reason: `${activeDeliveriesCount} active tasks (+0 pts)` });
  }
  score += workloadPts;

  // 3. Proximity to Pickup (Max 35 pts)
  let distanceKm = null;
  let proximityPts = 10;

  const vCoords = volunteer.userId?.locationCoordinates || volunteer.locationCoordinates;
  const dCoords = donation.pickupCoordinates;

  if (vCoords?.lat != null && vCoords?.lng != null && dCoords?.lat != null && dCoords?.lng != null) {
    distanceKm = calculateHaversineDistance(vCoords.lat, vCoords.lng, dCoords.lat, dCoords.lng);
  }

  if (distanceKm !== null && !isNaN(distanceKm)) {
    if (distanceKm <= 3) {
      proximityPts = 35;
      breakdown.push({ factor: 'Proximity', points: 35, reason: `Very close (~${distanceKm.toFixed(1)} km to pickup) (+35 pts)` });
    } else if (distanceKm <= 7) {
      proximityPts = 25;
      breakdown.push({ factor: 'Proximity', points: 25, reason: `Moderate distance (~${distanceKm.toFixed(1)} km to pickup) (+25 pts)` });
    } else if (distanceKm <= 12) {
      proximityPts = 15;
      breakdown.push({ factor: 'Proximity', points: 15, reason: `Fair distance (~${distanceKm.toFixed(1)} km to pickup) (+15 pts)` });
    } else {
      proximityPts = 5;
      breakdown.push({ factor: 'Proximity', points: 5, reason: `Farther location (~${distanceKm.toFixed(1)} km to pickup) (+5 pts)` });
    }
  } else {
    proximityPts = 10;
    breakdown.push({ factor: 'Proximity', points: 10, reason: 'Pickup address registered (+10 pts)' });
  }
  score += proximityPts;

  // 4. Vehicle & Quantity Suitability (Max 15 pts)
  let vehiclePts = 15;
  const vehicle = volunteer.vehicleType || 'Motorcycle';
  const qtyStr = (donation.quantity || '').toLowerCase();
  const isLargeBatch = qtyStr.includes('kg') || qtyStr.includes('portion') || parseInt(qtyStr) > 40;

  if (isLargeBatch) {
    if (['Car', 'Van'].includes(vehicle)) {
      vehiclePts = 15;
      breakdown.push({ factor: 'Vehicle', points: 15, reason: `${vehicle} is ideal for large food quantity (+15 pts)` });
    } else if (['Motorcycle'].includes(vehicle)) {
      vehiclePts = 10;
      breakdown.push({ factor: 'Vehicle', points: 10, reason: `${vehicle} can handle moderate to large food load (+10 pts)` });
    } else {
      vehiclePts = 2;
      breakdown.push({ factor: 'Vehicle', points: 2, reason: `${vehicle} limited capacity for heavy batch (+2 pts)` });
    }
  } else {
    if (['Motorcycle', 'Car', 'Van'].includes(vehicle)) {
      vehiclePts = 15;
      breakdown.push({ factor: 'Vehicle', points: 15, reason: `${vehicle} suitable for food delivery (+15 pts)` });
    } else {
      vehiclePts = 8;
      breakdown.push({ factor: 'Vehicle', points: 8, reason: `${vehicle} suitable for standard food delivery (+8 pts)` });
    }
  }
  score += vehiclePts;

  const suitabilityPercentage = Math.min(Math.round((score / maxScore) * 100), 100);

  let suitabilityLevel = 'Low';
  if (suitabilityPercentage >= 80) suitabilityLevel = 'High';
  else if (suitabilityPercentage >= 60) suitabilityLevel = 'Medium';

  return {
    suitabilityScore: score,
    suitabilityPercentage,
    suitabilityLevel,
    distanceKm,
    activeDeliveriesCount,
    breakdown,
  };
};

module.exports = { calculateVolunteerSuitability, calculateHaversineDistance };
