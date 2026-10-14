import type { Metadata } from "next";
import PublicVendorProfilePage from "@/modules/public/PublicVendorProfilePage";
import { getBranding } from "@/lib/branding/server";
import { getPublicVendorForPage } from "@/lib/seo/vendor-for-seo";
import { getSiteUrl } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/json-ld";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicVendorForPage(id);
  const { siteName } = await getBranding();
  const base = getSiteUrl();
  const canonical = `/vendors/${id}`;
  const name = profile?.businessName?.trim() || "Verified partner";
  const description =
    profile?.about?.trim().slice(0, 160) ||
    `View ${name}, a verified service partner on ${siteName}.`;

  return {
    title: name,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title: `${name} | ${siteName}`,
      description,
      url: `${base}${canonical}`,
      type: "profile",
      images: profile?.publicPhotoUrls?.[0]
        ? [{ url: profile.publicPhotoUrls[0] }]
        : undefined,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const profile = await getPublicVendorForPage(id);
  const name = profile?.businessName?.trim() || "Verified partner";

  return (
    <>
      {profile ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name,
            description: profile.about ?? undefined,
            image: profile.publicPhotoUrls?.[0] ?? undefined,
            areaServed: profile.serviceLocations ?? undefined,
          }}
        />
      ) : null}
      <PublicVendorProfilePage idOrSlug={id} initialProfile={profile} />
    </>
  );
}
