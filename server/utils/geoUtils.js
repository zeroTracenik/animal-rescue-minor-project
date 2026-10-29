/**
 * Animal Rescue Connect - Geolocation Utilities
 * Computes distances between rescue coordinates and NGO locations using Haversine formula
 */

/**
 * Calculates great-circle distance between two points on Earth using Haversine formula
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers (rounded to 1 decimal place)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Finds the nearest NGO for given coordinates
 * @param {number} lat
 * @param {number} lon
 * @param {Array} ngos
 * @returns {Object} Nearest NGO with distance and ranked list
 */
function findNearestNgo(lat, lon, ngos) {
  if (!ngos || ngos.length === 0) {
    return null;
  }

  // If no coordinates provided, return first NGO with default estimate
  if (!lat || !lon) {
    return {
      ngo: ngos[0],
      distanceKm: 3.5,
      isEstimated: true
    };
  }

  const ranked = ngos.map(ngo => {
    const distance = calculateDistance(lat, lon, ngo.latitude, ngo.longitude);
    return {
      ngo,
      distanceKm: distance
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    ngo: ranked[0].ngo,
    distanceKm: ranked[0].distanceKm,
    rankedList: ranked
  };
}

module.exports = {
  calculateDistance,
  findNearestNgo
};
