import { Suspense } from "react";
import type { Metadata } from "next";
import PackersMoversPage from "@/modules/services/PackersMoversPage";
import { getBranding } from "@/lib/branding/server";

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
  return (
      <PackersMoversPage />
  );
}
