import { Property } from "@/components/property/PropertyCard";
import { SUPPORT_EMAIL } from "@/lib/branding";
import { getBranding } from "@/lib/branding/server";
import { absoluteUrl, getSiteUrl, toAbsoluteImageUrl } from "@/lib/seo/site";

export async function buildOrganizationJsonLd() {
  const url = getSiteUrl();
  const { siteName } = await getBranding();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url,
    email: SUPPORT_EMAIL,
  };
}

export async function buildWebSiteJsonLd() {
  const url = getSiteUrl();
  const { siteName } = await getBranding();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/browse?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export async function buildBrowseCollectionJsonLd() {
  const url = absoluteUrl("/browse");
  const { siteName } = await getBranding();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Browse listings | ${siteName}`,
    description:
      "Search verified homes and commercial spaces for rent or sale across India. Filter by city, budget, BHK, and more.",
    url,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: getSiteUrl(),
    },
  };
}

export function buildRealEstateListingJsonLd(row?: Property, pathname?: string) {
  const url = absoluteUrl(pathname ?? "");
  if (!row) return null;
  const images = (row.images?.filter(Boolean) ?? [])
    .slice(0, 8)
    .map((u) => toAbsoluteImageUrl(u))
    .filter((x): x is string => Boolean(x));
  const primary = toAbsoluteImageUrl(row.image) ?? images[0];

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: row.title,
    description: row.description ?? undefined,
    url,
    image: images.length ? images : primary ? [primary] : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: row.location,
      addressLocality: row.locality,
      addressRegion: row.city,
      addressCountry: "IN",
    },
    offers: {
      "@type": "Offer",
      price: String(row.price ?? 0),
      priceCurrency: row.currency || "INR",
      availability: "https://schema.org/InStock",
      url,
    },
  };
}

export function buildFaqJsonLd(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export function buildServiceJsonLd({
  name,
  description,
  pathname,
}: {
  name: string;
  description: string;
  pathname: string;
}) {
  const url = absoluteUrl(pathname);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    provider: {
      "@type": "Organization",
      name: "The YBDC",
      url: getSiteUrl(),
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
  };
}


