import type { Metadata } from "next";
import { getBranding } from "@/lib/branding/server";
import { absoluteUrl, toAbsoluteImageUrl } from "@/lib/seo/site";
import { getCachedPropertyById } from "../server/cached-properties";
import { parsePropertyIdFromSlugParam } from "../property-slug";

function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export async function generatePropertyPageMetadata(slug: string): Promise<Metadata> {
  const id = parsePropertyIdFromSlugParam(slug);
  const [row, { siteName }] = await Promise.all([
    getCachedPropertyById(id!),
    getBranding(),
  ]);
  const canonicalPath = `/property/${slug}`;

  if (!row) {
    return {
      title: "Listing not found",
      description: `The requested property may have been removed. Browse more listings on ${siteName}.`,
      robots: { index: false, follow: true },
      alternates: { canonical: absoluteUrl(canonicalPath) },
    };
  }

  const location = [row.locality, row.city].filter(Boolean).join(", ");
  const title = clip(`${row.title} · ${location || row.city || "India"}`, 59);
  const listingPhrase =
    row.listingType === "Sale" ? "for sale" : row.listingType === "Lease" ? "for lease" : "for rent";
  const mentionBhk =
    row.bedrooms > 0 &&
    row.propertySector !== "plot" &&
    row.propertySector !== "commercial" &&
    row.postingType !== "pg";
  const rawDesc =
    row.description?.trim() ||
    (mentionBhk
      ? `${row.propertyType} ${listingPhrase} in ${location || row.city}. ${row.bedrooms} BHK, ${row.bathrooms} baths.`
      : `${row.propertyType} ${listingPhrase} in ${location || row.city}.`);
  const description = clip(rawDesc, 160);

  const canonical = absoluteUrl(canonicalPath);
  const ogImage = toAbsoluteImageUrl(row.image);
  const indexable = row.status === "Approved";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "en_IN",
      siteName,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: row.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: { index: indexable, follow: true },
  };
}
