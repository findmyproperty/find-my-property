import type { Metadata } from "next";
import PaintingCleaningPage from "@/modules/services/PaintingCleaningPage";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "Painting, Cleaning & Home Services",
    description: `Book painting, deep cleaning, carpenter, plumber and electrician services with ${siteName}. Vetted crews, eco-safe materials, and a satisfaction guarantee.`,
    openGraph: {
      title: `Painting, Cleaning & Home Services | ${siteName}`,
      description: `Request painting, cleaning or basic home services from ${siteName}. Professional, insured, and on-time.`,
      type: "website",
    },
    alternates: {
      canonical: "/painting-cleaning",
    },
  };
}

export default function Page() {
  return <PaintingCleaningPage />;
}
