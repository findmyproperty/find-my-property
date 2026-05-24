import type { User } from "@/contexts/auth-context";

const MAX_RETURN_PATH_LEN = 2048;

/**
 * Validates `from` query values to prevent open redirects.
 * Only same-origin relative paths are allowed (must start with a single `/`).
 */
export function parseSafeReturnPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s || s.length > MAX_RETURN_PATH_LEN) return null;
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (!s.startsWith("/")) return null;
  if (s.startsWith("//")) return null;
  if (s === "/login" || s.startsWith("/login?")) return null;
  if (s === "/register" || s.startsWith("/register?")) return null;
  return s;
}

/**
 * Build a return path from the current URL (for login/register links).
 * On `/login` or `/register`, reuses a safe existing `from` param when present.
 */
export function encodeReturnPathFromLocation(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  if (pathname === "/login" || pathname === "/register") {
    const existing = parseSafeReturnPath(searchParams.get("from"));
    return existing ?? "/";
  }
  const q = searchParams.toString();
  const path = pathname + (q ? `?${q}` : "");
  return parseSafeReturnPath(path) ?? "/";
}

export function buildLoginAndRegisterHrefs(pathname: string, searchParams: URLSearchParams) {
  const from = encodeReturnPathFromLocation(pathname, searchParams);
  const q = `?from=${encodeURIComponent(from)}`;
  return {
    loginHref: `/login${q}`,
    registerHref: `/register${q}`,
  };
}

/** Service pages that show login/signup in a modal instead of navigating away. */
export const SERVICE_AUTH_MODAL_PATHS = ["/packers-movers", "/painting-cleaning"] as const;

export function isServiceAuthModalPath(pathname: string): boolean {
  return SERVICE_AUTH_MODAL_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

export function getPostAuthRoute(user: User | null) {
  if (!user) return "/login";
  if (!user.onboardingCompleted) return "/onboarding";
  return "/dashboard";
}
