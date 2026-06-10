import type { MetadataRoute } from "next";
import { DEFAULT_LOCAL_API_URL } from "@/end-points/http";
import { buildPropertyPath } from "@/lib/property-slug";
import { getSiteUrl } from "@/lib/seo/site";

type PropertyRow = { id: number; title?: string | null; status?: string | null };

async function fetchApprovedPropertyRows(): Promise<PropertyRow[]> {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_LOCAL_API_URL;
  try {
    const res = await fetch(`${base}/properties`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const rows = (await res.json()) as PropertyRow[];
    if (!Array.isArray(rows)) return [];
    return rows.filter((r) => r?.id != null && r.status === "Approved");
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/browse`, lastModified, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/about`, lastModified, changeFrequency: "monthly", priority: 0.65 },
    { url: `${base}/contact`, lastModified, changeFrequency: "monthly", priority: 0.65 },
    { url: `${base}/packers-movers`, lastModified, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/painting-cleaning`, lastModified, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/event-management`, lastModified, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/sitemap`, lastModified, changeFrequency: "monthly", priority: 0.35 },
  ];

  const rows = await fetchApprovedPropertyRows();
  const propertyEntries: MetadataRoute.Sitemap = rows.map((r) => ({
    url: `${base}${buildPropertyPath(r.id, r.title)}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return [...staticEntries, ...propertyEntries];
}
