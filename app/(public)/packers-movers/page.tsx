import type { Metadata } from "next";
import PackersMoversPage from "@/modules/services/PackersMoversPage";
import { getBranding } from "@/lib/branding/server";
import { JsonLd } from "@/components/seo/json-ld";
import { buildServiceJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "Packers & Movers",
    description: `Book trusted packers & movers with ${siteName}. Transparent pricing, verified crews, and on-time moves across the city and beyond.`,
    openGraph: {
      title: `Packers & Movers | ${siteName}`,
      description: `Request a free moving quote from ${siteName}. Verified crews, transparent pricing, on-time delivery.`,
      type: "website",
    },
    alternates: {
      canonical: "/packers-movers",
    },
  };
}

export default function Page() {
  const serviceSchema = buildServiceJsonLd({
    name: "Packers & Movers Services",
    description:
      "Verified shifting crews, transparent pricing, safe packing, and on-time intercity and local relocation.",
    pathname: "/packers-movers",
  });

  return (
    <>
      <JsonLd data={serviceSchema} />
      <PackersMoversPage />
    </>
  );
}
