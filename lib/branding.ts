/**
 * Compile-time fallback for the brand name. The runtime source of truth is the
 * admin-editable `settings.site_name` row in the backend; this constant only
 * fills in when the API is unreachable or before SSR data has resolved.
 */
export const DEFAULT_SITE_NAME = "Find My Property";

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
