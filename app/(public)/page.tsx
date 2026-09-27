import { Suspense } from "react";
import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { getBranding } from "@/lib/branding/server";
import { getServerSettings } from "@/lib/server/cached-settings";
import { buildFaqJsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";
import Home from "@/modules/public/Index";
import { FeaturedPropertiesStreamingSection } from "@/modules/public/FeaturedPropertiesStreamingSection";
import { PropertyGridSkeleton } from "@/components/skeletons/property-grid-skeleton";

const HOME_OG_IMAGE =
  "https://framerusercontent.com/images/oSCsz14veQXmjGyGMAQAK0BUUA.png?width=1200&height=630";

const HOME_DESCRIPTION =
  "The YBDC connects you directly with verified real estate listings across India, supported by an ecosystem for relocation, home services, loans, and business consultancy.";

const DEFAULT_FAQS = [
  {
    question: "What makes The YBDC the premier property and consultancy platform?",
    answer:
      "We combine verified direct real estate listings with end-to-end relocation and business advisory services. Every listing and vendor undergoes documentation and physical inspection checks, ensuring a secure, seamless transaction from discovery to handover.",
  },
  {
    question: "How does The YBDC verification process work?",
    answer:
      "Our dedicated verification team checks property titles, ownership authenticity, and vendor credentials (including GST, trade licenses, and past track records). Only partners meeting our benchmark receive the verified mark.",
  },
  {
    question: "Can I deal directly with property owners and verified partners?",
    answer:
      "Yes. The YBDC facilitates transparent, direct communication between verified buyers/tenants and property owners or vetted service providers, removing unnecessary intermediaries and hidden commissions.",
  },
  {
    question: "What guarantees and support do you provide across service requests?",
    answer:
      "Every service request initiated on The YBDC is tracked within your account dashboard. Our central customer care team monitors milestones, enforces quality service level agreements (SLAs), and provides prompt dispute resolution if needed.",
  },
  {
    question: "Why choose The YBDC over generic classifieds and search engines?",
    answer:
      "Unlike open search engines that show unvetted advertisements, The YBDC provides a curated, accountable ecosystem with transparent pricing, verified identities, and an integrated suite of relocation and professional services all in one place.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  const homeTitle = `${siteName} — Verified Real Estate, Home Services & Advisory`;

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
          alt: `Explore verified properties and services on ${siteName}`,
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
      <Home siteName={siteName} serverSettings={serverSettings}>
        <Suspense fallback={<PropertyGridSkeleton count={4} columns="featured" />}>
          <FeaturedPropertiesStreamingSection />
        </Suspense>
      </Home>
    </>
  );
}
