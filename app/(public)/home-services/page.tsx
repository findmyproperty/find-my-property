import type { Metadata } from "next";
import HomeServicesPage from "@/modules/services/HomeServicesPage";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "Home Services",
    description: `Book carpenter, plumber, and electrician services with ${siteName}. Vetted professionals, transparent quotes, and supervised visits.`,
    openGraph: {
      title: `Home Services | ${siteName}`,
      description: `Request carpenter, plumbing, or electrical help from ${siteName}. Professional, insured, and on-time.`,
      type: "website",
    },
    alternates: {
      canonical: "/home-services",
    },
  };
}

export default function Page() {
  return <HomeServicesPage />;
}