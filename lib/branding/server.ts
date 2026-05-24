import "server-only";
import { cache } from "react";
import { cacheLife } from "next/cache";

import { DEFAULT_SITE_NAME } from "@/lib/branding";
import { getApiBaseUrl } from "@/end-points/http";

export type Branding = {
  siteName: string;
  primaryLogoUrl: string | null;
  faviconUrl: string | null;
};

const FALLBACK: Branding = {
  siteName: DEFAULT_SITE_NAME,
  primaryLogoUrl: null,
  faviconUrl: null,
};

const REVALIDATE_SECONDS = 600;

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
  cacheLife({ revalidate: REVALIDATE_SECONDS });

  try {
    const res = await fetch(`${getApiBaseUrl()}/settings`);
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as Partial<Branding> | null;
    return {
      siteName: data?.siteName?.trim() || FALLBACK.siteName,
      primaryLogoUrl: data?.primaryLogoUrl?.trim() || null,
      faviconUrl: data?.faviconUrl?.trim() || null,
    };
  } catch {
    return FALLBACK;
  }
});

export async function getSiteName(): Promise<string> {
  return (await getBranding()).siteName;
}
