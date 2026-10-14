import { cache } from "react";
import { DEFAULT_LOCAL_API_URL } from "@/end-points/http";
import type { PublicVendorOption, PublicVendorProfile } from "@/schema/vendor";

function getServerApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.INTERNAL_API_URL?.trim() ||
    DEFAULT_LOCAL_API_URL
  );
}

export const getPublicVendorForPage = cache(
  async (idOrSlug: string): Promise<PublicVendorProfile | null> => {
    const slug = idOrSlug.trim();
    if (!slug) return null;
    try {
      const res = await fetch(
        `${getServerApiBaseUrl()}/vendors/public/${encodeURIComponent(slug)}`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) return null;
      return res.json() as Promise<PublicVendorProfile>;
    } catch {
      return null;
    }
  },
);

export async function fetchPublicVendorSlugsForSitemap(): Promise<string[]> {
  try {
    const res = await fetch(`${getServerApiBaseUrl()}/vendors/public/select`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as PublicVendorOption[];
    if (!Array.isArray(rows)) return [];
    return rows
      .map((v) => v.slug?.trim() || String(v.userId))
      .filter(Boolean);
  } catch {
    return [];
  }
}
