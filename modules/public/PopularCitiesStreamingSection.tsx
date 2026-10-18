import { cacheLife, cacheTag } from "next/cache";

import { TAGS } from "@/config/tags";
import { LocalityHubsSection } from "@/modules/public/LocalityHubsSection";
import { buildPopularCitiesFromProperties } from "@/lib/property-location-options";
import { getCachedProperties } from "@/lib/server/cached-properties";

export async function PopularCitiesStreamingSection() {
  "use cache";
  cacheTag(TAGS.properties);

  const properties = await getCachedProperties();
  if (properties.length > 0) {
    cacheLife("days");
  } else {
    cacheLife("minutes");
  }

  const popularCities = buildPopularCitiesFromProperties(properties, 8);
  if (popularCities.length === 0) return null;

  return <LocalityHubsSection popularCities={popularCities} />;
}
