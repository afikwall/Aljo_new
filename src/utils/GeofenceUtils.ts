/**
 * Calculates the distance between two GPS coordinates using the Haversine formula
 * 
 * @param lat1 - Latitude of first point in decimal degrees
 * @param lng1 - Longitude of first point in decimal degrees
 * @param lat2 - Latitude of second point in decimal degrees
 * @param lng2 - Longitude of second point in decimal degrees
 * @returns Distance in meters
 */
export const calculateHaversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  // Earth's radius in meters
  const R = 6371000;

  // Convert degrees to radians
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLatRad = toRadians(lat2 - lat1);
  const deltaLngRad = toRadians(lng2 - lng1);

  // Haversine formula
  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in meters
  const distance = R * c;

  return distance;
};