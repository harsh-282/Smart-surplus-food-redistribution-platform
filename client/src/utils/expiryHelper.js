/**
 * Food Expiry Management Helper Functions (Frontend)
 */

/**
 * Calculates derived expiry status based on current date/time and expiryDate
 * @param {Date|string} expiryDate 
 * @param {Date} [now=new Date()]
 * @returns {'Fresh' | 'Expiring Soon' | 'Expired'}
 */
export const getExpiryStatus = (expiryDate, now = new Date()) => {
  if (!expiryDate) return 'Expired';
  const expTime = new Date(expiryDate).getTime();
  const currentTime = now.getTime();
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
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
export const getTimeRemaining = (expiryDate, now = new Date()) => {
  if (!expiryDate) return 'N/A';
  const expTime = new Date(expiryDate).getTime();
  const currentTime = now.getTime();
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
 * @param {Date} [now=new Date()]
 */
export const getExpiryInfo = (expiryDate, now = new Date()) => {
  const status = getExpiryStatus(expiryDate, now);
  const timeLeft = getTimeRemaining(expiryDate, now);

  return {
    status,
    timeLeft,
    isFresh: status === 'Fresh',
    isExpiringSoon: status === 'Expiring Soon',
    isExpired: status === 'Expired',
  };
};
