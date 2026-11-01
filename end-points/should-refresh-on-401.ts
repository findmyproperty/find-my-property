/**
 * Whether a 401 should trigger silent access-token refresh + retry.
 * Credential challenge endpoints must return false — their 401 means
 * "bad password / OTP", not "expired access token".
 */
export function shouldRefreshOn401(
  path: string,
  didRefresh: boolean | undefined,
  isBrowser: boolean,
): boolean {
  if (!isBrowser || didRefresh) return false;
  if (path === "/auth/refresh" || path === "/auth/logout") return false;
  if (path === "/auth/login") return false;
  if (path.startsWith("/auth/phone-otp")) return false;
  if (path.startsWith("/auth/email-otp")) return false;
  if (path.startsWith("/auth/password/forgot")) return false;
  return true;
}
