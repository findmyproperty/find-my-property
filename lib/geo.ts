export type GeoPoint = { lat: number; lng: number };

const SESSION_GPS_KEY = "browse_gps";

/** True when lat/lng are finite and within WGS84 bounds. */
export function isValidCoordinates(lat: unknown, lng: unknown): lat is number {
  if (lat == null || lng == null) return false;
  const la = Number(lat);
  const ln = Number(lng);
  return (
    Number.isFinite(la) &&
    Number.isFinite(ln) &&
    la >= -90 &&
    la <= 90 &&
    ln >= -180 &&
    ln <= 180 &&
    !(la === 0 && ln === 0)
  );
}

export function toGeoPoint(lat: unknown, lng: unknown): GeoPoint | null {
  if (!isValidCoordinates(lat, lng)) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function readSessionGps(): GeoPoint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_GPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: unknown; lng?: unknown };
    return toGeoPoint(parsed.lat, parsed.lng);
  } catch {
    return null;
  }
}

export function writeSessionGps(point: GeoPoint) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_GPS_KEY, JSON.stringify(point));
  } catch {
    /* quota / private mode */
  }
}

export function isPointInBounds(
  point: GeoPoint,
  bounds: google.maps.LatLngBounds,
  paddingRatio = 0.08,
): boolean {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const latSpan = ne.lat() - sw.lat();
  const lngSpan = ne.lng() - sw.lng();
  const padLat = latSpan * paddingRatio;
  const padLng = lngSpan * paddingRatio;
  return (
    point.lat <= ne.lat() + padLat &&
    point.lat >= sw.lat() - padLat &&
    point.lng <= ne.lng() + padLng &&
    point.lng >= sw.lng() - padLng
  );
}
