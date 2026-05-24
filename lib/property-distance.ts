import type { Property } from "@/lib/property-view-model";
import { haversineKm, isValidCoordinates, type GeoPoint } from "@/lib/geo";

/** Distance in km from origin using saved listing coordinates only (exact pins). */
export function propertyDistanceKm(property: Property, origin: GeoPoint): number | null {
  if (!isValidCoordinates(property.lat, property.lng)) return null;
  return haversineKm(origin, { lat: property.lat!, lng: property.lng! });
}

export function sortPropertiesByDistance(properties: Property[], origin: GeoPoint): Property[] {
  return [...properties].sort((a, b) => {
    const da = propertyDistanceKm(a, origin);
    const db = propertyDistanceKm(b, origin);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
}
