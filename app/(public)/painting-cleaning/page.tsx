import type { Metadata } from "next";
import PaintingCleaningPage from "@/modules/services/PaintingCleaningPage";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "Painting & Cleaning",
    description: `Book painting and deep cleaning services with ${siteName}. Vetted crews, eco-safe materials, and a satisfaction guarantee.`,
    openGraph: {
      title: `Painting & Cleaning | ${siteName}`,
      description: `Request painting or deep cleaning from ${siteName}. Professional, insured, and on-time.`,
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
