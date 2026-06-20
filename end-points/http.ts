export const DEFAULT_LOCAL_API_URL = "http://localhost:3005";

/** Thrown when `/auth/refresh` returns 401 — session cleared. */
export const AUTH_ERROR_SESSION_EXPIRED = "SESSION_EXPIRED";

/** Refresh failed (e.g. network / 5xx); access token may still work. */
export const AUTH_ERROR_REFRESH_FAILED = "REFRESH_FAILED";

export function getApiBaseUrl() {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    return configuredApiUrl ?? DEFAULT_LOCAL_API_URL;
}

export type RequestOptions = RequestInit & {
  token?: string;
  /** Internal: one retry after refresh (avoids loops). */
  _didRefresh?: boolean;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export function getStoredToken() {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("nb_token") || undefined;
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("nb_token");
    localStorage.removeItem("nb_user");
  } catch {
    /* ignore */
  }
}

function redirectToLogout() {
  if (typeof window === "undefined") return;
  window.location.assign("/logout");
}

function isBrowser() {
  return typeof window !== "undefined";
}

function shouldRefreshOn401(path: string, didRefresh: boolean | undefined): boolean {
  if (!isBrowser() || didRefresh) return false;
  if (path === "/auth/refresh" || path === "/auth/logout") return false;
  if (path.startsWith("/auth/phone-otp")) return false;
  return true;
}

type RefreshOutcome = "ok" | "invalid" | "failed";

let refreshPromise: Promise<RefreshOutcome> | null = null;

/**
 * POST /auth/refresh — backend reads the refresh token from the **HttpOnly cookie**
 * (`Set-Cookie` on login). The browser only attaches it if this request uses
 * `credentials: "include"` and the API URL is the cookie’s host (CORS must allow credentials).
 */
async function refreshAccessToken(): Promise<RefreshOutcome> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (res.status === 401) {
      return "invalid";
    }

    if (!res.ok) return "failed";

    const data = (await res.json()) as { access_token: string; refresh_token?: string };
    try {
      localStorage.setItem("nb_token", data.access_token);
    } catch {
      /* ignore */
    }

    window.dispatchEvent(
      new CustomEvent("fmp-access-token-updated", { detail: { accessToken: data.access_token } }),
    );
    return "ok";
  } catch {
    return "failed";
  }
}

function refreshOnce(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token: explicitToken, _didRefresh, ...init } = options;
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const effectiveToken =
    explicitToken !== undefined ? explicitToken : isBrowser() ? getStoredToken() : undefined;

  if (effectiveToken) {
    headers.set("Authorization", `Bearer ${effectiveToken}`);
  }

  const url = `${getApiBaseUrl()}${path}`;
  const credentials: RequestCredentials | undefined = isBrowser()
    ? (init.credentials ?? "include")
    : init.credentials;

  const response = await fetch(url, {
    ...init,
    headers,
    ...(credentials !== undefined ? { credentials } : {}),
  });

  if (response.status === 401 && shouldRefreshOn401(path, _didRefresh)) {
    const outcome = await refreshOnce();
    if (outcome === "ok") {
      return request<T>(path, { ...options, _didRefresh: true });
    }
    if (outcome === "invalid") {
      clearStoredSession();
      redirectToLogout();
      throw new Error(AUTH_ERROR_SESSION_EXPIRED);
    }
    throw new Error(AUTH_ERROR_REFRESH_FAILED);
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const errorBody = await response.json();
      if (Array.isArray(errorBody?.message)) {
        message = errorBody.message.join(", ");
      } else if (typeof errorBody?.message === "string") {
        message = errorBody.message;
      }
    } catch {
      message = response.statusText || message;
    }
    throw new ApiRequestError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
