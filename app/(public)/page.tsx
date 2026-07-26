import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { getBranding } from "@/lib/branding/server";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";
import Home from "@/modules/public/Index";

const HOME_OG_IMAGE =
  "https://framerusercontent.com/images/oSCsz14veQXmjGyGMAQAK0BUUA.png?width=1200&height=630";

const HOME_DESCRIPTION =
  "Discover properties and request trusted help for moving, cleaning, repairs, loans, careers, events, IT, and everyday needs—all in one place.";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  const homeTitle = `${siteName} — Property & everyday services in one place`;

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
          alt: `Explore property and everyday services on ${siteName}`,
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
  const [org, web, { siteName }] = await Promise.all([
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(),
    getBranding(),
  ]);

  return (
    <>
      <JsonLd data={[org, web]} />
      <Home siteName={siteName} />
    </>
  );
}
