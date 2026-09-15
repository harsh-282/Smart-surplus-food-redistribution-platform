/**
 * Food Expiry Management Helper Functions (Backend)
 */

/**
 * Calculates derived expiry status from expiryDate
 * @param {Date|string} expiryDate 
 * @param {Date} [now=new Date()]
 * @returns {'Fresh' | 'Expiring Soon' | 'Expired'}
 */
const getExpiryStatus = (expiryDate, now = new Date()) => {
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
 * Calculates human-readable time remaining or time elapsed since expiry
 * @param {Date|string} expiryDate 
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
const getTimeRemaining = (expiryDate, now = new Date()) => {
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
      return `Expired ${elapsedMins} ${elapsedMins === 1 ? 'minute' : 'minutes'} ago`;
    }
    return 'Expired just now';
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0
      ? `${days} ${days === 1 ? 'day' : 'days'} ${hours} ${hours === 1 ? 'hour' : 'hours'} left`
      : `${days} ${days === 1 ? 'day' : 'days'} left`;
  }

  if (hours > 0) {
    return minutes > 0
      ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`
      : `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
  }

  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`;
  }

  return 'Less than a minute left';
};

/**
 * Checks if a date has expired
 * @param {Date|string} expiryDate 
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
const isExpired = (expiryDate, now = new Date()) => {
  if (!expiryDate) return true;
  return new Date(expiryDate).getTime() <= now.getTime();
};

/**
 * Checks if food is expiring soon (<= 24h and not yet expired)
 * @param {Date|string} expiryDate 
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
const isExpiringSoon = (expiryDate, now = new Date()) => {
  if (!expiryDate) return false;
  const expTime = new Date(expiryDate).getTime();
  const currentTime = now.getTime();
  const diffMs = expTime - currentTime;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffMs > 0 && diffHours <= 24;
};

module.exports = {
  getExpiryStatus,
  getTimeRemaining,
  isExpired,
  isExpiringSoon,
};
