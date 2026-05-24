import type { Metadata } from "next";

/** Canonical site origin for metadata, canonical URLs, and JSON-LD. Override with `NEXT_PUBLIC_SITE_URL`. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const v = process.env.VERCEL_URL?.trim();
  if (v) {
    const host = v.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${p}`;
}

export function toAbsoluteImageUrl(src: string | null | undefined): string | undefined {
  if (!src?.trim()) return undefined;
  const s = src.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return absoluteUrl(s);
  return s;
}

/** Site origin string for Next.js `metadata.metadataBase` (must be plain, not a URL instance). */
export function metadataBase(): Metadata["metadataBase"] {
  return getSiteUrl();
}
