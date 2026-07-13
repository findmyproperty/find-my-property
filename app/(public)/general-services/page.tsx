import type { Metadata } from "next";
import GeneralServicesPage from "@/modules/services/GeneralServicesPage";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "General Services",
    description: `Book handyman help, errands, and general assistance with ${siteName}. Vetted helpers and supervised visits.`,
    openGraph: {
      title: `General Services | ${siteName}`,
      description: `Request everyday help from ${siteName}. Professional, reliable, and on-time.`,
      type: "website",
    },
    alternates: {
      canonical: "/general-services",
    },
  };
}

export default function Page() {
  return <GeneralServicesPage />;
}
