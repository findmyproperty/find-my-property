import "server-only";
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { TAGS } from "@/config/tags";

import { DEFAULT_BRANDING, type PublicBranding } from "@/lib/branding";
import { getServerApiBaseUrl } from "@/end-points/http";

export type Branding = PublicBranding;

const FALLBACK: Branding = DEFAULT_BRANDING;

const REVALIDATE_SECONDS = 600;

const publicBrandingSchema = z.object({
  siteName: z.string().nullish(),
  primaryLogoUrl: z.string().nullish(),
  faviconUrl: z.string().nullish(),
});

function normalizeBranding(input: unknown): Branding {
  const parsed = publicBrandingSchema.safeParse(input);
  if (!parsed.success) return FALLBACK;

  return {
    siteName: parsed.data.siteName?.trim() || FALLBACK.siteName,
    primaryLogoUrl: parsed.data.primaryLogoUrl?.trim() || null,
    faviconUrl: parsed.data.faviconUrl?.trim() || null,
  };
}

/**
 * Server-only branding lookup. Reads the singleton `settings` row from the
 * backend and exposes only the fields needed for SSR metadata, layout chrome,
 * and JSON-LD. Cached two ways:
 *   1. React `cache()` dedupes calls within a single request.
 *   2. Next's data cache (`fetch` `revalidate` + `tags`) shares results across
 *      requests until `revalidateTag('settings')` is called from the admin
 *      save action.
 *
 * Always resolves — network/parse failures fall back to the compile-time
 * constants so SSR never blocks on a flaky settings endpoint.
 */
export const getBranding = cache(async (): Promise<Branding> => {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife({ revalidate: REVALIDATE_SECONDS });

  try {
    const res = await fetch(`${getServerApiBaseUrl()}/settings`);
    if (!res.ok) return FALLBACK;
    return normalizeBranding(await res.json());
  } catch {
    return FALLBACK;
  }
});

export async function getSiteName(): Promise<string> {
  return (await getBranding()).siteName;
}
