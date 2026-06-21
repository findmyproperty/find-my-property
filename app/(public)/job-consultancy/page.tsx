import type { Metadata } from "next";
import JobConsultancyPage from "@/modules/job-consultancy/JobConsultancyPage";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "Job Consultancy",
    description: `Job consultancy for IT, Non IT & Customer Support roles with ${siteName}. One simple form — a career consultant calls you back.`,
    openGraph: {
      title: `Job Consultancy | ${siteName}`,
      description: `Explore career opportunities in IT, Non IT & Customer Support with ${siteName}.`,
      type: "website",
    },
    alternates: { canonical: "/job-consultancy" },
  };
}

export default function Page() {
  return <JobConsultancyPage />;
}