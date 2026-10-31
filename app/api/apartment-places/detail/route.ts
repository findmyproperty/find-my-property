import { NextRequest, NextResponse } from "next/server";
import {
  getApartmentPlaceDetail,
  hasServerMapsApiKey,
} from "@/lib/server/cached-apartment-places";

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId")?.trim() ?? "";

  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  if (!hasServerMapsApiKey()) {
    return NextResponse.json(
      { error: "missing_server_key", clientFallback: true },
      { status: 503 },
    );
  }

  try {
    const detail = await getApartmentPlaceDetail(placeId);
    if (!detail) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }
    return NextResponse.json({ detail, clientFallback: false });
  } catch (error) {
    console.error("Apartment place detail route failed:", error);
    return NextResponse.json(
      { error: "places_error", clientFallback: true },
      { status: 502 },
    );
  }
}
