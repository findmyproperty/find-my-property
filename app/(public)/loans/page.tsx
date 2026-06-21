import type { Metadata } from "next";
import LoanPage from "@/modules/loans/LoanPage";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "Loans",
    description: `Apply for home loans, personal loans, vehicle finance, and mortgages with ${siteName}. One simple form — a specialist calls you back.`,
    openGraph: {
      title: `Loans | ${siteName}`,
      description: `Explore loan options and get expert assistance from ${siteName}.`,
      type: "website",
    },
    alternates: { canonical: "/loans" },
  };
}

export default function Page() {
  return <LoanPage />;
}