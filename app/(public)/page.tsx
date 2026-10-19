import { Suspense } from "react";
import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { getBranding } from "@/lib/branding/server";
import { getServerSettings } from "@/lib/server/cached-settings";
import { buildFaqJsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";
import Home from "@/modules/public/Index";
import { FeaturedPropertiesStreamingSection } from "@/modules/public/FeaturedPropertiesStreamingSection";
import { PopularCitiesStreamingSection } from "@/modules/public/PopularCitiesStreamingSection";
import { PropertyGridSkeleton } from "@/components/skeletons/property-grid-skeleton";

const HOME_OG_IMAGE =
  "https://framerusercontent.com/images/oSCsz14veQXmjGyGMAQAK0BUUA.png?width=1200&height=630";

const HOME_DESCRIPTION =
  "The YBDC connects you with approved real estate listings across India, supported by an ecosystem for relocation, home services, loans, and business consultancy.";

const DEFAULT_FAQS = [
  {
    question: "What can I do on The YBDC?",
    answer:
      "Browse property listings, contact the listing representative, and explore related home, finance, and business services.",
  },
  {
    question: "How are property listings reviewed?",
    answer:
      "New property listings are reviewed by the platform team before approval. Approval is a platform review, not a legal title guarantee; verify documents independently before proceeding.",
  },
  {
    question: "Who can I contact about a property?",
    answer:
      "Use the enquiry options on the property page to contact the owner or the agent assigned to that listing.",
  },
  {
    question: "Where can I get help with a service request?",
    answer:
      "Check your account for available request updates, or contact platform support if you need help.",
  },
  {
    question: "How can I compare properties on The YBDC?",
    answer:
      "Browse listings and compare their available location, price, photos, amenities, and property details. Contact the listing representative to confirm information before making a decision.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  const homeTitle = `${siteName} — Property Listings, Home Services & Advisory`;

  return {
    title: { absolute: homeTitle },
    description: HOME_DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
      url: absoluteUrl("/"),
      title: homeTitle,
      description: HOME_DESCRIPTION,
      images: [
        {
          url: HOME_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `Explore property listings and services on ${siteName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: homeTitle,
      description: HOME_DESCRIPTION,
      images: [HOME_OG_IMAGE],
    },
  };
}

export default async function Page() {
  const [org, web, { siteName }, serverSettings] = await Promise.all([
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(),
    getBranding(),
    getServerSettings(),
  ]);

  const faqItems = serverSettings?.faqs && serverSettings.faqs.length > 0
    ? serverSettings.faqs
    : DEFAULT_FAQS;

  const faqSchema = buildFaqJsonLd(faqItems);
  const schemas = [org, web, ...(faqSchema ? [faqSchema] : [])];

  return (
    <>
      <JsonLd data={schemas} />
      <Home
        siteName={siteName}
        serverSettings={serverSettings}
        popularCitiesContent={
          <Suspense fallback={null}>
            <PopularCitiesStreamingSection />
          </Suspense>
        }
      >
        <Suspense fallback={<PropertyGridSkeleton count={4} columns="featured" />}>
          <FeaturedPropertiesStreamingSection />
        </Suspense>
      </Home>
    </>
  );
}
