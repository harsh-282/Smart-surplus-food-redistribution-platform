/**
 * Food Expiry Management Helper Functions (Frontend)
 */

/**
 * Calculates derived expiry status based on current date/time and expiryDate
 * @param {Date|string} expiryDate 
 * @param {Date} [now=new Date()]
 * @returns {'Fresh' | 'Expiring Soon' | 'Expired'}
 */
function resolveNowAndStatus(nowArg, statusArg) {
  let now = new Date();
  let status = '';

  if (typeof nowArg === 'string' && !statusArg) {
    if (['Completed', 'Delivered', 'Available', 'Accepted', 'Pickup Assigned', 'Picked Up', 'Cancelled', 'Pending'].includes(nowArg) || isNaN(Date.parse(nowArg))) {
      status = nowArg;
    } else {
      now = new Date(nowArg);
    }
  } else {
    if (nowArg instanceof Date) {
      now = nowArg;
    } else if (nowArg && !isNaN(new Date(nowArg).getTime())) {
      now = new Date(nowArg);
    }
    status = statusArg || '';
  }

  return { now, status };
}

/**
 * Calculates derived expiry status based on current date/time and expiryDate
 * @param {Date|string} expiryDate 
 * @param {Date|string} [now=new Date()]
 * @param {string} [status='']
 * @returns {'Fresh' | 'Expiring Soon' | 'Expired' | 'Completed'}
 */
export const getExpiryStatus = (expiryDate, now = new Date(), status = '') => {
  const resolved = resolveNowAndStatus(now, status);
  if (['Completed', 'Delivered'].includes(resolved.status)) {
    return 'Completed';
  }
  if (!expiryDate) return 'Expired';
  const expTime = new Date(expiryDate).getTime();
  const currentTime = resolved.now.getTime();
  const diffMs = expTime - currentTime;

  if (diffMs <= 0) {
    return 'Expired';
  }

  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 24) {
    return 'Expiring Soon';
  }

  return 'Fresh';
};

/**
 * Formats time remaining or elapsed time since expiry in a clean, human-readable format
 * @param {Date|string} expiryDate 
 * @param {Date|string} [now=new Date()]
 * @param {string} [status='']
 * @returns {string}
 */
export const getTimeRemaining = (expiryDate, now = new Date(), status = '') => {
  const resolved = resolveNowAndStatus(now, status);
  if (['Completed', 'Delivered'].includes(resolved.status)) {
    return 'Completed';
  }
  if (!expiryDate) return 'N/A';
  const expTime = new Date(expiryDate).getTime();
  const currentTime = resolved.now.getTime();
  const diffMs = expTime - currentTime;

  if (diffMs <= 0) {
    const elapsedMs = Math.abs(diffMs);
    const elapsedMins = Math.floor(elapsedMs / (1000 * 60));
    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

    if (elapsedDays > 0) {
      return elapsedDays === 1 ? 'Expired yesterday' : `Expired ${elapsedDays} days ago`;
    }
    if (elapsedHours > 0) {
      return `Expired ${elapsedHours} ${elapsedHours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (elapsedMins > 0) {
      return `Expired ${elapsedMins} ${elapsedMins === 1 ? 'min' : 'mins'} ago`;
    }
    return 'Expired just now';
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0
      ? `${days} ${days === 1 ? 'day' : 'days'} ${hours} ${hours === 1 ? 'hr' : 'hrs'} left`
      : `${days} ${days === 1 ? 'day' : 'days'} left`;
  }

  if (hours > 0) {
    return minutes > 0
      ? `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${minutes} ${minutes === 1 ? 'min' : 'mins'} left`
      : `${hours} ${hours === 1 ? 'hr' : 'hrs'} left`;
  }

  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'} left`;
  }

  return '< 1 min left';
};

/**
 * Returns complete expiry metadata object for convenience
 * @param {Date|string} expiryDate 
 * @param {Date|string} [now=new Date()]
 * @param {string} [status='']
 */
export const getExpiryInfo = (expiryDate, now = new Date(), status = '') => {
  const resolved = resolveNowAndStatus(now, status);
  if (['Completed', 'Delivered'].includes(resolved.status)) {
    return {
      status: 'Completed',
      timeLeft: 'Completed',
      isFresh: false,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  const expiryStatus = getExpiryStatus(expiryDate, resolved.now, resolved.status);
  const timeLeft = getTimeRemaining(expiryDate, resolved.now, resolved.status);

  return {
    status: expiryStatus,
    timeLeft,
    isFresh: expiryStatus === 'Fresh',
    isExpiringSoon: expiryStatus === 'Expiring Soon',
    isExpired: expiryStatus === 'Expired',
  };
};
