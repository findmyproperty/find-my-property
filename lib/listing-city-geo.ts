import { type ListingCity, isListingCity } from "@/lib/property-posting";

export type CityGeo = {
  lat: number;
  lng: number;
  /** Circle radius in meters for Places locationBias (max 50_000). */
  radiusMeters: number;
};

/** City centers used to bias apartment / society Places search. */
export const LISTING_CITY_GEO: Record<ListingCity, CityGeo> = {
  // Places circle radius max is 50km — covers suburbs like Poonamallee from Chennai centre.
  Chennai: { lat: 13.0827, lng: 80.2707, radiusMeters: 50_000 },
  Bengaluru: { lat: 12.9716, lng: 77.5946, radiusMeters: 50_000 },
};

export function getListingCityGeo(city: string): CityGeo | null {
  if (!isListingCity(city)) return null;
  return LISTING_CITY_GEO[city];
}
