/**
 * Smart Rule-Based Donation Priority Scoring Utility for FoodShare
 * 
 * Provides a transparent, non-AI rule-based priority score from 0 to 100.
 * Priority considers:
 * 1. Expiry Urgency (max 40 pts)
 * 2. Distance (max 25 pts)
 * 3. Food Quantity (max 15 pts)
 * 4. Food Category (max 10 pts)
 * 5. NGO Category Preference Match (max 10 pts)
 */

import { calculateHaversineDistance, formatDistance } from './distanceHelper';
import { getTimeRemaining } from './expiryHelper';

// Centralized Weight Configuration (Easily configurable in one place)
export const PRIORITY_WEIGHTS = {
  expiry: 40,
  distance: 25,
  quantity: 15,
  category: 10,
  preference: 10,
};

// Priority Tiers & Configuration
export const PRIORITY_LEVELS = {
  CRITICAL: {
    level: 'CRITICAL',
    label: 'Critical Priority',
    minScore: 90,
    icon: '🔴',
    badgeClass: 'priority-badge-critical',
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.15)',
    border: 'rgba(220, 38, 38, 0.4)',
  },
  HIGH: {
    level: 'HIGH',
    label: 'High Priority',
    minScore: 70,
    icon: '🟠',
    badgeClass: 'priority-badge-high',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.15)',
    border: 'rgba(234, 88, 12, 0.4)',
  },
  MEDIUM: {
    level: 'MEDIUM',
    label: 'Medium Priority',
    minScore: 40,
    icon: '🟡',
    badgeClass: 'priority-badge-medium',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.15)',
    border: 'rgba(217, 119, 6, 0.4)',
  },
  NORMAL: {
    level: 'NORMAL',
    label: 'Normal Priority',
    minScore: 0,
    icon: '🟢',
    badgeClass: 'priority-badge-normal',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.15)',
    border: 'rgba(22, 163, 74, 0.4)',
  },
};

/**
 * Safely extracts a numeric quantity value from strings like "15 kg", "50 meals", "10", etc.
 */
export const parseQuantityNumber = (qtyStr) => {
  if (!qtyStr) return 10; // Neutral fallback
  if (typeof qtyStr === 'number') return isNaN(qtyStr) ? 10 : Math.abs(qtyStr);
  
  const match = String(qtyStr).match(/\d+(\.\d+)?/);
  if (match) {
    const val = parseFloat(match[0]);
    return isNaN(val) ? 10 : Math.abs(val);
  }
  return 10;
};

/**
 * Main transparent, rule-based donation priority calculation.
 * 
 * @param {Object} donation - Donation item schema/object
 * @param {Object|number|null} ngoLocationOrDistance - NGO lat/lng object ({lat, lng}) or direct distance in km
 * @param {Object|null} ngoProfile - NGO profile containing acceptedCategories
 * @param {Date} [now=new Date()] - Reference timestamp
 * @returns {Object} Structured priority score details
 */
export const calculateDonationPriority = (donation, ngoLocationOrDistance = null, ngoProfile = null, now = new Date()) => {
  if (!donation) {
    return {
      score: 0,
      level: 'NORMAL',
      label: 'Normal Priority',
      icon: '🟢',
      badgeClass: 'priority-badge-normal',
      color: '#16a34a',
      expiryScore: 0,
      distanceScore: 0,
      quantityScore: 0,
      categoryScore: 0,
      preferenceScore: 0,
      isPreferenceMatch: false,
      isDistanceAvailable: false,
      distanceKm: null,
      reasons: ['No donation data available'],
      isExpired: false,
    };
  }

  const reasons = [];

  // --- 1. Expiry Urgency Scoring (Max 40 points) ---
  let expiryScore = 0;
  let isExpired = false;

  if (!donation.expiryDate) {
    expiryScore = 5;
    reasons.push('Expiry date not specified');
  } else {
    const expTime = new Date(donation.expiryDate).getTime();
    const currTime = now.getTime();
    const diffMs = expTime - currTime;

    if (diffMs <= 0) {
      isExpired = true;
      expiryScore = 0;
      reasons.push('Food donation has expired');
    } else {
      const hoursLeft = diffMs / (1000 * 60 * 60);
      const timeLeftText = getTimeRemaining(donation.expiryDate, now);

      if (hoursLeft < 6) {
        expiryScore = 40;
        reasons.push(`Food expires in ${timeLeftText} (Critical urgency)`);
      } else if (hoursLeft < 12) {
        expiryScore = 32;
        reasons.push(`Food expires in ${timeLeftText} (High urgency)`);
      } else if (hoursLeft < 24) {
        expiryScore = 24;
        reasons.push(`Food expires in ${timeLeftText} (Medium-high urgency)`);
      } else if (hoursLeft < 48) {
        expiryScore = 14;
        reasons.push(`Food expires in ${timeLeftText} (Medium urgency)`);
      } else {
        expiryScore = 5;
        reasons.push(`Food expires in ${timeLeftText} (Fresh item)`);
      }
    }
  }

  // --- 2. Distance Scoring (Max 25 points) ---
  let distanceScore = 0;
  let distanceKm = null;
  let isDistanceAvailable = false;

  if (typeof ngoLocationOrDistance === 'number') {
    if (!isNaN(ngoLocationOrDistance) && isFinite(ngoLocationOrDistance) && ngoLocationOrDistance >= 0) {
      distanceKm = ngoLocationOrDistance;
    }
  } else if (ngoLocationOrDistance && typeof ngoLocationOrDistance === 'object') {
    const dCoords = donation.pickupCoordinates || donation.donorId?.locationCoordinates;
    if (ngoLocationOrDistance.lat != null && dCoords?.lat != null) {
      distanceKm = calculateHaversineDistance(
        ngoLocationOrDistance.lat,
        ngoLocationOrDistance.lng,
        dCoords.lat,
        dCoords.lng
      );
    }
  }

  if (distanceKm !== null && !isNaN(distanceKm) && isFinite(distanceKm)) {
    isDistanceAvailable = true;
    const distFormatted = formatDistance(distanceKm);
    if (distanceKm <= 5) {
      distanceScore = 25;
      reasons.push(`Donation is only ${distFormatted} away`);
    } else if (distanceKm <= 10) {
      distanceScore = 20;
      reasons.push(`Donation is ${distFormatted} away`);
    } else if (distanceKm <= 25) {
      distanceScore = 14;
      reasons.push(`Donation is ${distFormatted} away`);
    } else if (distanceKm <= 50) {
      distanceScore = 8;
      reasons.push(`Donation is ${distFormatted} away`);
    } else {
      distanceScore = 2;
      reasons.push(`Donation is ${distFormatted} away (Longer distance)`);
    }
  } else {
    isDistanceAvailable = false;
    distanceScore = 0;
    reasons.push('Distance contribution unavailable (coordinates missing)');
  }

  // --- 3. Quantity Scoring (Max 15 points) ---
  let quantityScore = 0;
  const qtyNum = parseQuantityNumber(donation.quantity);

  if (qtyNum >= 50) {
    quantityScore = 15;
    reasons.push(`Large quantity available (${donation.quantity || '50+ units'})`);
  } else if (qtyNum >= 20) {
    quantityScore = 11;
    reasons.push(`Substantial quantity available (${donation.quantity || '20+ units'})`);
  } else if (qtyNum >= 10) {
    quantityScore = 7;
    reasons.push(`Medium quantity available (${donation.quantity || '10+ units'})`);
  } else {
    quantityScore = 4;
    reasons.push(`Small quantity (${donation.quantity || '< 10 units'})`);
  }

  // --- 4. Food Category Scoring (Max 10 points) ---
  let categoryScore = 0;
  const cat = donation.category || 'Other';

  if (cat === 'Cooked Food') {
    categoryScore = 10;
    reasons.push('Highly perishable category (Cooked Food)');
  } else if (cat === 'Dairy' || cat === 'Bakery') {
    categoryScore = 8;
    reasons.push(`Perishable category (${cat})`);
  } else if (cat === 'Fruits' || cat === 'Raw Vegetables') {
    categoryScore = 6;
    reasons.push(`Fresh produce category (${cat})`);
  } else {
    categoryScore = 4;
    reasons.push(`Category (${cat})`);
  }

  // --- 5. NGO Category Preference Match Scoring (Max 10 points) ---
  let preferenceScore = 0;
  let isPreferenceMatch = false;

  if (ngoProfile?.acceptedCategories && Array.isArray(ngoProfile.acceptedCategories) && ngoProfile.acceptedCategories.length > 0) {
    if (ngoProfile.acceptedCategories.includes('All') || ngoProfile.acceptedCategories.includes(cat)) {
      preferenceScore = 10;
      isPreferenceMatch = true;
      reasons.push(`Matches NGO preferred category (${cat})`);
    }
  }

  // --- Total Priority Score Calculation ---
  let rawTotal = expiryScore + distanceScore + quantityScore + categoryScore + preferenceScore;
  let finalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  if (isNaN(finalScore) || !isFinite(finalScore)) {
    finalScore = 0;
  }

  // If expired, score is 0 and cannot be claimed
  if (isExpired) {
    finalScore = 0;
  }

  // Tier Assignment
  let levelInfo = PRIORITY_LEVELS.NORMAL;
  if (!isExpired) {
    if (finalScore >= PRIORITY_LEVELS.CRITICAL.minScore) {
      levelInfo = PRIORITY_LEVELS.CRITICAL;
    } else if (finalScore >= PRIORITY_LEVELS.HIGH.minScore) {
      levelInfo = PRIORITY_LEVELS.HIGH;
    } else if (finalScore >= PRIORITY_LEVELS.MEDIUM.minScore) {
      levelInfo = PRIORITY_LEVELS.MEDIUM;
    }
  }

  return {
    score: finalScore,
    level: levelInfo.level,
    label: levelInfo.label,
    icon: levelInfo.icon,
    badgeClass: levelInfo.badgeClass,
    color: levelInfo.color,
    bg: levelInfo.bg,
    border: levelInfo.border,
    expiryScore,
    distanceScore,
    quantityScore,
    categoryScore,
    preferenceScore,
    isPreferenceMatch,
    isDistanceAvailable,
    distanceKm,
    reasons,
    isExpired,
  };
};
