import "server-only";
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/config/tags";
import { getServerApiBaseUrl } from "@/end-points/http";
import { settingsSchema, type Settings } from "@/schema/setting";

/**
 * Server-only settings lookup. Reads the active settings row from the
 * backend with full field parsing and caches using Next.js 16 cache components.
 * Invalidate on demand via `revalidateTag(TAGS.settings)` or `updateTag(TAGS.settings)`.
 */
export const getServerSettings = cache(async (): Promise<Settings | null> => {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("days");

  try {
    const res = await fetch(`${getServerApiBaseUrl()}/settings`);
    if (!res.ok) return null;
    const json = await res.json();
    const parsed = settingsSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
});
