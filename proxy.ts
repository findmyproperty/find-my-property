import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FMP_ROLE_COOKIE, FMP_RT_COOKIE } from "@/lib/fmp-cookie";
import { parseSafeReturnPath } from "@/lib/auth-redirect";

function hasReferenceToken(request: NextRequest): boolean {
  const v = request.cookies.get(FMP_RT_COOKIE)?.value;
  return Boolean(v && v.trim().length > 0);
}

/** Paths that do not require `fmp-rt` (marketing, auth, property detail, logout). */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/sitemap") return true;
  if (pathname === "/sitemap.xml") return true;
  if (pathname === "/logout") return true;
  if (pathname === "/login") return true;
  if (pathname.startsWith("/register")) return true;
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname.startsWith("/verify-agent")) return true;
  if (pathname.startsWith("/register-vendor")) return true;
  if (pathname === "/about") return true;
  if (pathname === "/contact") return true;
  if (pathname === "/terms-and-conditions") return true;
  if (pathname === "/browse") return true;
  if (pathname === "/owner") return true;
  if (pathname.startsWith("/property/")) return true;
  if (pathname === "/packers-movers") return true;
  if (pathname === "/painting-cleaning") return true;
  if (pathname === "/home-services") return true;
  if (pathname === "/it-services") return true;
  if (pathname === "/general-services") return true;
  if (pathname === "/event-management") return true;
  if (pathname === "/loans") return true;
  if (pathname.startsWith("/loans/")) return true;
  if (pathname === "/job-consultancy") return true;
  if (pathname.startsWith("/vendors/")) return true;

  return false;
}

/** Flat routes only admins may open */
const ADMIN_ONLY = new Set(["/approvals", "/agents", "/properties", "/admin"]);

/** Agent + admin (not tenant/vendor) */
const AGENT_SCOPED = new Set(["/reports"]);

/** Vendor + admin */
const VENDOR_SCOPED = new Set(["/wallet", "/support"]);

function pathMatchesSet(pathname: string, prefixes: Set<string>) {
  for (const p of prefixes) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}

function role(request: NextRequest): string | undefined {
  return request.cookies.get(FMP_ROLE_COOKIE)?.value;
}

/**
 * Role guard using `fmp-role` cookie (set on login in `auth-context`).
 * Auth enforcement for API/data still happens server-side; this only steers navigation.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const r = role(request);

  if (
    isPublicPath(pathname)
  ) {
    return NextResponse.next();
  }

  if (!hasReferenceToken(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const pathWithQuery = pathname + request.nextUrl.search;
    const safeReturn = parseSafeReturnPath(pathWithQuery);
    if (safeReturn) {
      url.searchParams.set("from", safeReturn);
    }
    return NextResponse.redirect(url);
  }

  if (!r || !["admin", "agent", "tenant", "vendor"].includes(r)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (pathMatchesSet(pathname, ADMIN_ONLY) && r !== "admin") {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathMatchesSet(pathname, AGENT_SCOPED) && (r === "tenant" || r === "vendor")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathMatchesSet(pathname, VENDOR_SCOPED) && r !== "vendor" && r !== "admin") {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname === "/leads" || pathname.startsWith("/leads/")) {
    if (r === "tenant") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
