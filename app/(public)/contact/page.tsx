import type { Metadata } from "next";
import ContactPage from "@/modules/public/ContactPage";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "Contact",
    description: `Contact ${siteName} for help with property listings, service requests, accounts, vendor partnerships, and platform feedback.`,
    alternates: {
      canonical: "/contact",
    },
    openGraph: {
      title: `Contact | ${siteName}`,
      description: `Get help with property listings, service requests, accounts, and vendor partnerships on ${siteName}.`,
    },
  };
}

export default async function Page() {
  const { siteName } = await getBranding();
  return <ContactPage siteName={siteName} />;
}
