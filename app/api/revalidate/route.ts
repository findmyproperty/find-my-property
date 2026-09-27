import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { TAGS } from "@/config/tags";

function getSecret(req: NextRequest): string | null {
  const fromQuery = req.nextUrl.searchParams.get("secret");
  if (fromQuery) return fromQuery;
  return req.headers.get("x-revalidate-secret");
}

/**
 * On-demand cache invalidation for public property data (same idea as Shopify webhooks).
 * Call from your backend after create/update/delete, or from CI.
 *
 * Examples:
 * - `POST /api/revalidate?secret=...` body `{ "scope": "all" }` — full catalog
 * - `POST /api/revalidate?secret=...` body `{ "scope": "property", "propertyId": "12" }` — one listing
 */
export async function POST(req: NextRequest) {
  const secret = getSecret(req);
  const expected = process.env.REVALIDATION_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let scope: "all" | "property" | "settings" = "all";
  let propertyId: string | undefined;

  try {
    const body = (await req.json()) as {
      scope?: "all" | "property" | "settings";
      propertyId?: string;
    };
    if (body?.scope === "property") scope = "property";
    if (body?.scope === "settings") scope = "settings";
    if (body?.propertyId) propertyId = String(body.propertyId);
  } catch {
    // no JSON body — default scope all
  }

  if (scope === "property" && propertyId) {
    revalidateTag(TAGS.property(propertyId), "max");
  } else if (scope === "settings") {
    revalidateTag(TAGS.settings, "max");
  } else {
    revalidateTag(TAGS.properties, "max");
    revalidateTag(TAGS.settings, "max");
  }

  return NextResponse.json({
    ok: true,
    revalidated: true,
    scope,
    propertyId: propertyId ?? null,
    now: Date.now(),
  });
}
