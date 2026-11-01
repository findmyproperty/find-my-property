/** Keys used for client-side session material (never store refresh tokens here). */
export const AUTH_STORAGE_KEYS = [
  "nb_token",
  "nb_user",
  /** Legacy — refresh belongs in the HttpOnly `fmp-rt` cookie only. */
  "nb_refresh_token",
] as const;

/** Clears all known client auth keys from `localStorage`. */
export function clearClientAuthStorage(storage: Storage = localStorage): void {
  for (const key of AUTH_STORAGE_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      /* ignore quota / private mode */
    }
  }
}

const ALLOWED_ROLES = new Set(["admin", "agent", "tenant", "vendor"]);

/** Returns a normalized role or null when the value is not an allowed role. */
export function sanitizeAuthRole(role: string | null | undefined): string | null {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  return ALLOWED_ROLES.has(normalized) ? normalized : null;
}

/** Build `/auth/verify` path with a safely encoded token query param. */
export function buildVerifyAgentPath(token: string): string {
  return `/auth/verify?token=${encodeURIComponent(token)}`;
}
