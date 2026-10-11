import { cacheLife, cacheTag } from "next/cache";

import { TAGS } from "@/config/tags";
import { buildHeroSlides, type HeroSlide } from "@/lib/hero-slides";
import { getCachedProperties } from "@/lib/server/cached-properties";
import { getServerSettings } from "@/lib/server/cached-settings";

/** Homepage hero — tagged so settings or listing edits refresh the prerender. */
export async function getCachedHeroSlides(): Promise<HeroSlide[]> {
  "use cache";
  cacheTag(TAGS.properties, TAGS.settings);

  const [properties, settings] = await Promise.all([
    getCachedProperties(),
    getServerSettings(),
  ]);
  const slides = buildHeroSlides(properties, settings);

  if (properties.length === 0) {
    cacheLife("minutes");
  } else {
    cacheLife("days");
  }
  return slides;
}
