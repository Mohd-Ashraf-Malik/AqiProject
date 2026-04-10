const toRadians = (value) => (value * Math.PI) / 180;

export const calculateDistanceInKm = (pointA, pointB) => {
  const earthRadiusKm = 6371;
  const latitudeDiff = toRadians(pointB.latitude - pointA.latitude);
  const longitudeDiff = toRadians(pointB.longitude - pointA.longitude);

  const latitudeA = toRadians(pointA.latitude);
  const latitudeB = toRadians(pointB.latitude);

  const haversineValue =
    Math.sin(latitudeDiff / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDiff / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversineValue));
};
