import { sanitizeAuthRole } from "@/lib/auth-storage";

/** Cookie set on login for `proxy.ts` role checks (must match server-readable name). */
export const FMP_ROLE_COOKIE = "fmp-role";

/** Reference (access) token cookie for `proxy.ts` — must be present on protected routes. */
export const FMP_RT_COOKIE = "fmp-rt";

const ONE_YEAR_S = 60 * 60 * 24 * 365;

/**
 * Client-side: persist role for edge/proxy routing on the app origin.
 * Only allowlisted roles are written (forged/unknown values are ignored).
 * UI still reconciles against `user.role` from the session; mismatch forces logout.
 */
export function setFmpRoleCookieClient(role: string) {
  if (typeof document === "undefined") return;
  const safe = sanitizeAuthRole(role);
  if (!safe) return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? ";Secure"
      : "";
  document.cookie = `${FMP_ROLE_COOKIE}=${encodeURIComponent(safe)};path=/;max-age=${ONE_YEAR_S};SameSite=Lax${secure}`;
}

export function clearFmpRoleCookieClient() {
  if (typeof document === "undefined") return;
  document.cookie = `${FMP_ROLE_COOKIE}=;path=/;max-age=0;SameSite=Lax`;
}
