import { NextRequest, NextResponse } from "next/server";

function parseCoords(url: string): { lat: number; lng: number } | null {
  const patterns = [
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /\/maps\/place\/[^/@]*\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /\/maps\/search\/(-?\d+\.?\d*),\+?(-?\d+\.?\d*)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (!match) continue;
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

function isAllowedMapsHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host === "maps.google.com" ||
    host.endsWith(".google.com") ||
    host === "www.google.co.in" ||
    host === "google.co.in"
  );
}

/** Resolve short Google Maps share links to lat/lng via server-side redirect follow. */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!isAllowedMapsHost(parsedUrl.hostname)) {
    return NextResponse.json({ error: "unsupported host" }, { status: 400 });
  }

  const direct = parseCoords(raw);
  if (direct) {
    return NextResponse.json(direct);
  }

  try {
    const res = await fetch(raw, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; YBDCMapsExpand/1.0; +https://theybdc.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    const finalUrl = res.url || raw;
    const fromFinal = parseCoords(finalUrl);
    if (fromFinal) {
      return NextResponse.json({ ...fromFinal, resolvedUrl: finalUrl });
    }
    const html = await res.text();
    const fromHtml = parseCoords(html.slice(0, 200_000));
    if (fromHtml) {
      return NextResponse.json({ ...fromHtml, resolvedUrl: finalUrl });
    }
  } catch {
    return NextResponse.json({ error: "could not resolve link" }, { status: 422 });
  }

  return NextResponse.json({ error: "coordinates not found" }, { status: 422 });
}
