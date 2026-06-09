import type { Metadata } from "next";
import PublicVendorProfilePage from "@/modules/public/PublicVendorProfilePage";
import { getBranding } from "@/lib/branding/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { siteName } = await getBranding();
  return {
    title: "Partner profile",
    description: `View a verified service partner on ${siteName}.`,
    robots: { index: true, follow: true },
    alternates: { canonical: `/vendors/${id}` },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PublicVendorProfilePage idOrSlug={id} />;
}
