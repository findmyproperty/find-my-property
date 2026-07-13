import type { SystemLog } from "@/schema/system-log";

/**
 * Hide error-level rows (and the "error" category filter) from the
 * Admin Activity Log UI in production. Errors are still persisted in
 * the backend `system_logs` table — only display is suppressed so
 * end-users / clients don't see internal stack traces.
 *
 * Evaluated at build time so dead branches drop out of the bundle.
 */
export const HIDE_ERRORS_IN_UI = process.env.NODE_ENV === "production";

/**
 * Translation layer: turns raw HTTP-level system-log rows into
 * human-readable activity feed entries. Works purely on the existing
 * SystemLog shape (no backend migration needed).
 *
 * If a future backend pushes domain events (eventType + actorName), this
 * mapper still works — it just falls through to the URL-based mapping.
 */

export type ActivityCategory =
  | "service"
  | "listing"
  | "lead"
  | "user"
  | "auth"
  | "system"
  | "error";

export interface ActivityEvent {
  id: number;
  title: string;
  category: ActivityCategory;
  actor?: string;
  timestamp: Date;
  level: SystemLog["level"];
  /** Short ms / status badge shown in subtitle ("HTTP 409", "1.2s") */
  meta?: string;
  /** Pre-formatted key/value pairs safe for display (PII-redacted). */
  safeDetails: Array<{ label: string; value: string }>;
  /** Routine/noisy event (e.g. silent token refresh). Hidden by default. */
  chatty: boolean;
  /** Raw log kept for super-admin "technical details" view. */
  raw: SystemLog;
}

interface RouteMatch {
  title: (params: RouteParams) => string;
  category: ActivityCategory;
  /** If true, treat this event as low-signal and hide from the feed by default. */
  chatty?: boolean;
}

interface RouteParams {
  id?: string;
  /** Raw URL (with query stripped). */
  path: string;
  /** Parsed `request.body` if the interceptor stored it. */
  body: Record<string, unknown> | undefined;
}

/** Ordered: the first matcher wins. Keep more specific routes before wildcards. */
const ROUTE_MAP: Array<{
  method: string;
  test: RegExp;
  match: RouteMatch;
}> = [
  // Service requests
  {
    method: "POST",
    test: /^\/service-requests\/packers-movers$/,
    match: {
      title: () => "New Packers & Movers request submitted",
      category: "service",
    },
  },
  {
    method: "POST",
    test: /^\/service-requests\/painting-cleaning$/,
    match: {
      title: () => "New Painting & Cleaning request submitted",
      category: "service",
    },
  },
  {
    method: "POST",
    test: /^\/service-requests\/home-services$/,
    match: {
      title: () => "New Home Services request submitted",
      category: "service",
    },
  },
  {
    method: "POST",
    test: /^\/service-requests\/it-services$/,
    match: {
      title: () => "New IT Services request submitted",
      category: "service",
    },
  },
  {
    method: "POST",
    test: /^\/service-requests\/general-services$/,
    match: {
      title: () => "New General Services request submitted",
      category: "service",
    },
  },
  {
    method: "PATCH",
    test: /^\/admin\/service-requests\/(\d+)$/,
    match: {
      title: ({ id, body }) => {
        const status = body?.status;
        if (typeof status === "string" && status.length > 0) {
          return `Service request #${id} marked "${humanStatus(status)}"`;
        }
        return `Service request #${id} updated`;
      },
      category: "service",
    },
  },
  {
    method: "POST",
    test: /^\/loan-requests$/,
    match: {
      title: () => "New loan application submitted",
      category: "service",
    },
  },
  {
    method: "POST",
    test: /^\/job-consultancy$/,
    match: {
      title: () => "New job consultancy inquiry submitted",
      category: "service",
    },
  },
  {
    method: "PATCH",
    test: /^\/admin\/loan-requests\/(\d+)$/,
    match: {
      title: ({ id, body }) => {
        const status = body?.status;
        if (typeof status === "string" && status.length > 0) {
          return `Loan request #${id} marked "${humanStatus(status)}"`;
        }
        return `Loan request #${id} updated`;
      },
      category: "service",
    },
  },
  {
    method: "PATCH",
    test: /^\/admin\/job-consultancy\/(\d+)$/,
    match: {
      title: ({ id, body }) => {
        const status = body?.status;
        if (typeof status === "string" && status.length > 0) {
          return `Job consultancy #${id} marked "${humanStatus(status)}"`;
        }
        return `Job consultancy #${id} updated`;
      },
      category: "service",
    },
  },

  // Properties / listings
  {
    method: "POST",
    test: /^\/properties$/,
    match: { title: () => "New property listing created", category: "listing" },
  },
  {
    method: "PATCH",
    test: /^\/properties\/(\d+)\/approve$/,
    match: { title: ({ id }) => `Property #${id} approved`, category: "listing" },
  },
  {
    method: "PATCH",
    test: /^\/properties\/(\d+)\/reject$/,
    match: { title: ({ id }) => `Property #${id} rejected`, category: "listing" },
  },
  {
    method: "PATCH",
    test: /^\/properties\/(\d+)$/,
    match: { title: ({ id }) => `Property #${id} edited`, category: "listing" },
  },
  {
    method: "DELETE",
    test: /^\/properties\/(\d+)$/,
    match: { title: ({ id }) => `Property #${id} removed`, category: "listing" },
  },
  {
    method: "POST",
    test: /^\/properties\/(\d+)\/comments$/,
    match: {
      title: ({ id }) => `Comment posted on property #${id}`,
      category: "listing",
    },
  },

  // Leads & enquiries
  {
    method: "POST",
    test: /^\/leads$/,
    match: { title: () => "New enquiry received", category: "lead" },
  },
  {
    method: "PATCH",
    test: /^\/leads\/(\d+)$/,
    match: { title: ({ id }) => `Enquiry #${id} updated`, category: "lead" },
  },
  {
    method: "POST",
    test: /^\/contact$/,
    match: { title: () => "Contact form submitted", category: "lead" },
  },

  // Auth
  {
    method: "POST",
    test: /^\/auth\/phone-otp\/request$/,
    match: {
      title: ({ body }) => {
        const phone = typeof body?.phone === "string" ? body.phone : "";
        return phone ? `OTP sent to ${redactPhone(phone)}` : "OTP requested";
      },
      category: "auth",
    },
  },
  {
    method: "POST",
    test: /^\/auth\/phone-otp\/verify$/,
    match: { title: () => "User signed in", category: "auth" },
  },
  {
    method: "POST",
    test: /^\/auth\/logout$/,
    match: { title: () => "User signed out", category: "auth" },
  },
  {
    method: "POST",
    test: /^\/auth\/refresh$/,
    match: { title: () => "Session refreshed", category: "auth", chatty: true },
  },

  // Users & agents
  {
    method: "POST",
    test: /^\/users$/,
    match: { title: () => "New user registered", category: "user" },
  },
  {
    method: "PATCH",
    test: /^\/users\/(\d+)$/,
    match: { title: ({ id }) => `User #${id} profile updated`, category: "user" },
  },
  {
    method: "PATCH",
    test: /^\/users\/favorites\/(\d+)$/,
    match: {
      title: ({ id }) => `Property #${id} added/removed from favorites`,
      category: "user",
    },
  },
  {
    method: "DELETE",
    test: /^\/users\/(\d+)$/,
    match: { title: ({ id }) => `User #${id} account deleted`, category: "user" },
  },
  {
    method: "POST",
    test: /^\/agents$/,
    match: { title: () => "Agent added", category: "user" },
  },
  {
    method: "PATCH",
    test: /^\/agents\/(\d+)$/,
    match: { title: ({ id }) => `Agent #${id} updated`, category: "user" },
  },
  {
    method: "DELETE",
    test: /^\/agents\/(\d+)$/,
    match: { title: ({ id }) => `Agent #${id} removed`, category: "user" },
  },

  // Settings / uploads
  {
    method: "PATCH",
    test: /^\/settings$/,
    match: { title: () => "System settings updated", category: "system" },
  },
  {
    method: "POST",
    test: /^\/upload$/,
    match: { title: () => "File uploaded", category: "system" },
  },
];

const HTTP_STATUS_TEXT: Record<number, string> = {
  400: "Bad request",
  401: "Sign-in required",
  403: "Not allowed",
  404: "Not found",
  409: "Conflict — record already exists",
  422: "Validation failed",
  429: "Too many requests",
  500: "Server error",
  502: "Upstream unavailable",
  503: "Service unavailable",
};

function humanStatus(status: string): string {
  switch (status) {
    case "new":
      return "New";
    case "contacted":
      return "Contacted";
    case "scheduled":
      return "Scheduled";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function stripQuery(url: string | null | undefined): string {
  if (!url) return "";
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

export function redactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  const last = digits.slice(-4);
  return `+${phone.startsWith("+") ? "" : ""}•••• ${last}`.trim();
}

export function redactEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "•••";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, 1);
  return `${visible}${"•".repeat(Math.max(local.length - 1, 2))}${domain}`;
}

export function redactIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  if (ip === "::1" || ip === "127.0.0.1") return "Localhost";
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) return `${m[1]}.${m[2]}.xx.xx`;
  if (ip.includes(":")) return ip.split(":").slice(0, 2).join(":") + ":••";
  return ip;
}

const PII_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "otp",
  "code",
]);

function redactValue(key: string, value: unknown): string {
  if (value == null) return "—";
  if (PII_KEYS.has(key)) return "•••";
  if (typeof value === "string") {
    if (/^(\+?\d[\d\s\-]{6,})$/.test(value.trim())) return redactPhone(value);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return redactEmail(value);
    if (value.length > 120) return value.slice(0, 120) + "…";
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    const json = JSON.stringify(value);
    return json.length > 160 ? json.slice(0, 160) + "…" : json;
  } catch {
    return "[unserialisable]";
  }
}

function parseDuration(message: string): number | null {
  const m = message.match(/(\d+)\s*ms/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function formatDurationMeta(ms: number): string | undefined {
  if (!Number.isFinite(ms)) return undefined;
  if (ms < 1000) return undefined; // only highlight slow calls
  return `${(ms / 1000).toFixed(1)}s`;
}

function buildSafeDetails(
  log: SystemLog,
  resolvedPath: string,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  const ctx = (log.context ?? {}) as Record<string, unknown>;

  if (log.method && resolvedPath) {
    rows.push({ label: "Endpoint", value: `${log.method} ${resolvedPath}` });
  }
  if (typeof ctx.statusCode === "number") {
    rows.push({ label: "HTTP status", value: String(ctx.statusCode) });
  }
  if (typeof ctx.duration === "string") {
    rows.push({ label: "Duration", value: ctx.duration });
  } else if (typeof ctx.duration === "number") {
    rows.push({ label: "Duration", value: `${ctx.duration}ms` });
  }
  if (log.userId != null) {
    rows.push({ label: "User", value: `#${log.userId}` });
  }
  const ip = redactIp(log.ip ?? null);
  if (ip) rows.push({ label: "From", value: ip });
  if (log.source) rows.push({ label: "Module", value: log.source });

  const body = (ctx.body ?? {}) as Record<string, unknown>;
  const bodyKeys = Object.keys(body).slice(0, 6);
  for (const k of bodyKeys) {
    rows.push({ label: k, value: redactValue(k, body[k]) });
  }
  return rows;
}

function extractBody(log: SystemLog): Record<string, unknown> | undefined {
  const ctx = log.context as Record<string, unknown> | null | undefined;
  if (!ctx) return undefined;
  const body = ctx.body;
  if (body && typeof body === "object") return body as Record<string, unknown>;
  return undefined;
}

/** Core mapper: raw SystemLog → ActivityEvent. */
export function formatLogEvent(log: SystemLog): ActivityEvent {
  const timestamp = typeof log.timestamp === "string" ? new Date(log.timestamp) : log.timestamp;
  const ctx = (log.context ?? {}) as Record<string, unknown>;
  const method = (log.method || (typeof ctx.method === "string" ? (ctx.method as string) : "")).toUpperCase();
  const url = stripQuery(log.url || (typeof ctx.url === "string" ? (ctx.url as string) : ""));
  const body = extractBody(log);

  // Error path — prefer human-friendly HTTP status over raw "Exception: ..."
  if (log.level === "error") {
    const statusCode = typeof ctx.statusCode === "number" ? ctx.statusCode : undefined;
    const routeTitle = matchRouteTitle(method, url, body);
    const humanStatusText =
      statusCode && HTTP_STATUS_TEXT[statusCode]
        ? HTTP_STATUS_TEXT[statusCode]
        : log.message.replace(/^Exception:\s*/i, "") || "Something went wrong";

    const title = routeTitle
      ? `${humanStatusText} — ${routeTitle.title}`
      : humanStatusText;

    return {
      id: log.id,
      title,
      category: "error",
      actor: log.userId ? `User #${log.userId}` : undefined,
      timestamp,
      level: log.level,
      meta: statusCode ? `HTTP ${statusCode}` : undefined,
      safeDetails: buildSafeDetails(log, url),
      chatty: false,
      raw: log,
    };
  }

  // Info / debug / warn paths — try URL→event translation first
  const routed = matchRouteTitle(method, url, body);

  const duration = parseDuration(log.message);
  const meta = duration ? formatDurationMeta(duration) : undefined;

  if (routed) {
    return {
      id: log.id,
      title: routed.title,
      category: log.level === "warn" ? "error" : routed.category,
      actor: log.userId ? `User #${log.userId}` : "Guest",
      timestamp,
      level: log.level,
      meta,
      safeDetails: buildSafeDetails(log, url),
      chatty: routed.chatty ?? false,
      raw: log,
    };
  }

  // Fallback — readable best-effort (still hide raw method+url from the main title)
  return {
    id: log.id,
    title: fallbackTitle(method, url, log.message),
    category: "system",
    actor: log.userId ? `User #${log.userId}` : undefined,
    timestamp,
    level: log.level,
    meta,
    safeDetails: buildSafeDetails(log, url),
    chatty: false,
    raw: log,
  };
}

function matchRouteTitle(
  method: string,
  path: string,
  body: Record<string, unknown> | undefined,
): { title: string; category: ActivityCategory; chatty: boolean } | null {
  for (const entry of ROUTE_MAP) {
    if (entry.method !== method) continue;
    const m = entry.test.exec(path);
    if (!m) continue;
    return {
      title: entry.match.title({ id: m[1], path, body }),
      category: entry.match.category,
      chatty: entry.match.chatty ?? false,
    };
  }
  return null;
}

function fallbackTitle(method: string, url: string, rawMessage: string): string {
  if (method && url) {
    const segment = url.split("/").filter(Boolean)[0] ?? "system";
    const label = segment.replace(/-/g, " ");
    switch (method) {
      case "POST":
        return `New ${label} action`;
      case "PATCH":
      case "PUT":
        return `${capitalize(label)} updated`;
      case "DELETE":
        return `${capitalize(label)} removed`;
      default:
        return `${capitalize(label)} activity`;
    }
  }
  return rawMessage || "System activity";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------ Presentation ------------------------------ */

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  service: "Services",
  listing: "Listings",
  lead: "Enquiries",
  user: "Users",
  auth: "Logins",
  system: "System",
  error: "Errors",
};

/** Tailwind class bundles per category — used by ActivityItem for the icon chip. */
export const CATEGORY_STYLE: Record<
  ActivityCategory,
  { chip: string; ring: string; text: string }
> = {
  service: {
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    ring: "ring-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  listing: {
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    ring: "ring-sky-500/20",
    text: "text-sky-700 dark:text-sky-300",
  },
  lead: {
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    ring: "ring-violet-500/20",
    text: "text-violet-700 dark:text-violet-300",
  },
  user: {
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    ring: "ring-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
  },
  auth: {
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    ring: "ring-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
  },
  system: {
    chip: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    ring: "ring-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
  },
  error: {
    chip: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    ring: "ring-red-500/30",
    text: "text-red-700 dark:text-red-300",
  },
};

export function groupByDay(events: ActivityEvent[]): Array<{
  key: string;
  label: string;
  items: ActivityEvent[];
}> {
  const out: Array<{ key: string; label: string; items: ActivityEvent[] }> = [];
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;

  for (const ev of events) {
    const dayStart = startOfDay(ev.timestamp).getTime();
    const key = String(dayStart);
    let label: string;
    if (dayStart === today) label = "Today";
    else if (dayStart === yesterday) label = "Yesterday";
    else
      label = ev.timestamp.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    const last = out[out.length - 1];
    if (last && last.key === key) last.items.push(ev);
    else out.push({ key, label, items: [ev] });
  }
  return out;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
