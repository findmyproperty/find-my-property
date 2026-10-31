import { NextRequest, NextResponse } from "next/server";
import { MIN_APARTMENT_PLACE_QUERY_LENGTH } from "@/lib/apartment-places";
import {
  hasServerMapsApiKey,
  searchApartmentPlaces,
} from "@/lib/server/cached-apartment-places";
import { isListingCity } from "@/lib/property-posting";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";

  if (!isListingCity(city)) {
    return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  }

  if (q.length < MIN_APARTMENT_PLACE_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [], clientFallback: false });
  }

  // Browser referrer-restricted NEXT_PUBLIC_GOOGLE_MAP_KEY cannot call Places server-side.
  if (!hasServerMapsApiKey()) {
    return NextResponse.json({
      suggestions: [],
      clientFallback: true,
      reason: "missing_server_key",
    });
  }

  try {
    const suggestions = await searchApartmentPlaces(q, city);
    return NextResponse.json({ suggestions, clientFallback: false });
  } catch (error) {
    console.error("Apartment places route failed:", error);
    // Do not cache failures in the route response layer; let the client fall back.
    return NextResponse.json({
      suggestions: [],
      clientFallback: true,
      reason: "places_error",
    });
  }
}
