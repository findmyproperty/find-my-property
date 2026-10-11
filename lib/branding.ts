/**
 * Compile-time fallback for the brand name. The runtime source of truth is the
 * admin-editable `settings.site_name` row in the backend; this constant only
 * fills in when the API is unreachable or before SSR data has resolved.
 */
export const DEFAULT_SITE_NAME = "The YBDC";
export const BRAND_EXPANSION = "Yashas Business Development & Consultancy";

/** Backwards-compatible alias — many call sites still import `SITE_NAME`. */
export const SITE_NAME = DEFAULT_SITE_NAME;

/** Static fallback icon served from /public when no admin favicon is set. */
export const DEFAULT_FAVICON_URL = "/default-favicon.ico";

export type PublicBranding = {
  siteName: string;
  primaryLogoUrl: string | null;
  faviconUrl: string | null;
};

export const DEFAULT_BRANDING: PublicBranding = {
  siteName: DEFAULT_SITE_NAME,
  primaryLogoUrl: null,
  faviconUrl: null,
};

/** Public support inbox (override with `NEXT_PUBLIC_SUPPORT_EMAIL`). */
export const SUPPORT_EMAIL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
    ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL.trim()
    : "findmypropertysrealtysolution@gmail.com";

/** Public office shown in footer, contact page, and Organization JSON-LD. */
export const OFFICE_ADDRESS_LINES = [
  "12 Block BDA Layout, Stage 2, Nagarbhavi",
  "Bengaluru, Karnataka 560072",
] as const;

export const OFFICE_ADDRESS_FULL = OFFICE_ADDRESS_LINES.join(", ");

export const OFFICE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=12%20Block%20BDA%20Layout%2C%20Stage%202%2C%20Nagarbhavi%2C%20Bengaluru%2C%20Karnataka%20560072";
