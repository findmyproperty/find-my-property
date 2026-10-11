import type { Property } from "@/lib/property-view-model";
import { mapBackendProperty, type BackendProperty } from "@/lib/property-mapper";
import { request } from "@/end-points/http";
import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/config/tags";

/** Public catalog — safe to cache; invalidate with `TAGS.properties` (or per-row tags). */
export async function getCachedProperties(): Promise<Property[]> {
  "use cache";
  cacheTag(TAGS.properties);

  try {
    const rows = await request<BackendProperty[]>("/properties");
    const mapped = rows.map((property) => mapBackendProperty(property));
    if(mapped.length === 0) {
      cacheLife("minutes");
    } else {
      cacheLife("days");
    }
    return mapped;
  } catch (error) {
    console.error("Failed to fetch cached properties:", error);
    cacheLife("minutes");
    return [];
  }
}


/** Single public property — safe to cache; invalidate with `TAGS.property(id)`. */
export async function getCachedPropertyById(id: string): Promise<Property | undefined> {
  "use cache";
  cacheTag(TAGS.property(id));
  cacheLife("days");

  try {
    const property = await request<BackendProperty>(`/properties/${id}`);
    return mapBackendProperty(property);
  } catch {
    return undefined;
  }
}

/**
 * Single public property. Tagged with both the global catalog and this id so you can
 * revalidate only `TAGS.property(id)` or the whole list with `TAGS.properties`.
 */
export async function getCachedProperty(id: string): Promise<Property | undefined> {
  "use cache";
  cacheTag(TAGS.properties, TAGS.property(id));
  cacheLife("days");

  try {
    const property = await request<BackendProperty>(`/properties/${id}`);
    return mapBackendProperty(property);
  } catch {
    return undefined;
  }
}
