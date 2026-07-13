import type { Metadata } from "next";
import ItServicesPage from "@/modules/services/ItServicesPage";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "IT Services",
    description: `Book laptop repair, networking, CCTV, and software support with ${siteName}. Vetted IT professionals and transparent quotes.`,
    openGraph: {
      title: `IT Services | ${siteName}`,
      description: `Request on-site IT support from ${siteName}. Professional, reliable, and on-time.`,
      type: "website",
    },
    alternates: {
      canonical: "/it-services",
    },
  };
}

export default function Page() {
  return <ItServicesPage />;
}
