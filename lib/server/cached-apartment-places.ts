import { cacheLife } from "next/cache";
import {
  type ApartmentPlaceDetail,
  type ApartmentPlaceSuggestion,
  MIN_APARTMENT_PLACE_QUERY_LENGTH,
} from "@/lib/apartment-places";
import { getListingCityGeo } from "@/lib/listing-city-geo";
import { isListingCity } from "@/lib/property-posting";

const THREE_WEEKS_SECONDS = 3 * 7 * 24 * 60 * 60; // 1_814_400
const MAX_RESULTS = 8;

export type { ApartmentPlaceDetail, ApartmentPlaceSuggestion };
export { MIN_APARTMENT_PLACE_QUERY_LENGTH as MIN_QUERY_LENGTH };

/** Browser-restricted `NEXT_PUBLIC_GOOGLE_MAP_KEY` cannot call Places from the server. */
export function getServerMapsApiKey(): string | null {
  const serverKey = process.env.GOOGLE_MAPS_SERVER_KEY?.trim();
  return serverKey || null;
}

export function hasServerMapsApiKey(): boolean {
  return Boolean(getServerMapsApiKey());
}

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      text?: { text?: string };
    };
  }>;
  error?: { message?: string; status?: string };
};

type PlaceDetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{
    longText?: string;
    types?: string[];
  }>;
  error?: { message?: string; status?: string };
};

/**
 * City-scoped apartment / society autocomplete. Cached 3 weeks per query+city.
 * Requires `GOOGLE_MAPS_SERVER_KEY` (IP / none restrictions). Throws on Google errors
 * so failed responses are not stored in the data cache.
 */
export async function searchApartmentPlaces(
  query: string,
  city: string,
): Promise<ApartmentPlaceSuggestion[]> {
  "use cache";
  cacheLife({ revalidate: THREE_WEEKS_SECONDS });

  const trimmed = query.trim().replace(/\s+/g, " ");
  if (trimmed.length < MIN_APARTMENT_PLACE_QUERY_LENGTH || !isListingCity(city)) {
    return [];
  }

  const apiKey = getServerMapsApiKey();
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_SERVER_KEY is not configured");
  }

  const geo = getListingCityGeo(city);
  if (!geo) return [];

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
      body: JSON.stringify({
        input: trimmed,
        includedRegionCodes: ["in"],
        languageCode: "en",
        regionCode: "IN",
        // Hard city scope — bias alone still surfaces famous out-of-city hits (e.g. HSR → Bengaluru).
        locationRestriction: {
          circle: {
            center: { latitude: geo.lat, longitude: geo.lng },
            radius: geo.radiusMeters,
          },
        },
      }),
    });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places autocomplete failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as AutocompleteResponse;
  return mapSuggestions(data, city).slice(0, MAX_RESULTS);
}

function blockedCityTokens(city: string): string[] {
  if (city === "Chennai") return ["bengaluru", "bangalore", "bengalooru"];
  if (city === "Bengaluru") return ["chennai", "madras"];
  return [];
}

function mapSuggestions(
  data: AutocompleteResponse,
  city: string,
): ApartmentPlaceSuggestion[] {
  const blocked = blockedCityTokens(city);
  const out: ApartmentPlaceSuggestion[] = [];
  for (const suggestion of data.suggestions ?? []) {
    const pred = suggestion.placePrediction;
    if (!pred) continue;
    const placeId = pred.placeId?.trim();
    if (!placeId) continue;
    const name =
      pred.structuredFormat?.mainText?.text?.trim() ||
      pred.text?.text?.trim() ||
      "";
    if (!name) continue;
    const secondaryText = pred.structuredFormat?.secondaryText?.text?.trim() || undefined;
    const haystack = `${name} ${secondaryText ?? ""} ${pred.text?.text ?? ""}`.toLowerCase();
    if (blocked.some((token) => haystack.includes(token))) continue;
    out.push({ placeId, name, secondaryText });
  }
  return out;
}

/**
 * Place details for a selected suggestion. Cached 3 weeks per placeId.
 */
export async function getApartmentPlaceDetail(
  placeId: string,
): Promise<ApartmentPlaceDetail | null> {
  "use cache";
  cacheLife({ revalidate: THREE_WEEKS_SECONDS });

  const id = placeId.trim();
  if (!id) return null;

  const apiKey = getServerMapsApiKey();
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_SERVER_KEY is not configured");
  }

  const resourceName = id.startsWith("places/") ? id : `places/${id}`;

  const res = await fetch(`https://places.googleapis.com/v1/${resourceName}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,location,addressComponents",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Place detail failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as PlaceDetailsResponse;
  const lat = data.location?.latitude;
  const lng = data.location?.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const locality =
    data.addressComponents?.find((c) => c.types?.includes("sublocality_level_1"))
      ?.longText ||
    data.addressComponents?.find((c) => c.types?.includes("sublocality"))?.longText ||
    data.addressComponents?.find((c) => c.types?.includes("neighborhood"))?.longText ||
    data.addressComponents?.find((c) => c.types?.includes("locality"))?.longText;

  return {
    placeId: (data.id ?? id).replace(/^places\//, ""),
    name: data.displayName?.text?.trim() || "",
    formattedAddress: data.formattedAddress,
    lat: lat as number,
    lng: lng as number,
    locality: locality?.trim() || undefined,
  };
}
