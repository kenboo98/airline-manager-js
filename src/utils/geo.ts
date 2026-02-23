const EARTH_RADIUS_NM = 3440.065

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function haversineDistanceNm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_NM * c
}

export function flightDurationMinutes(distanceNm: number, speedKnots: number): number {
  return Math.ceil((distanceNm / speedKnots) * 60)
}

export function interpolatePosition(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  progress: number,
): { lat: number; lng: number } {
  const t = Math.max(0, Math.min(1, progress))
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  }
}
