import PropertyDetail from "@/modules/properties/PropertyDetail";
import { PropertyListingArticle } from "@/modules/properties/detail/property-listing-article";
import { JsonLd } from "@/components/seo/json-ld";
import { generatePropertyPageMetadata } from "@/lib/seo/generate-property-metadata";
import { buildRealEstateListingJsonLd } from "@/lib/seo/jsonld";
import { parsePropertyIdFromSlugParam } from "@/lib/property-slug";
import { getCachedProperties, getCachedPropertyById } from "@/lib/server/cached-properties";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return generatePropertyPageMetadata(slug);
}

export default async function PropertyBySlugPage({ params }: Props) {
  const { slug } = await params;
  const id = parsePropertyIdFromSlugParam(slug);
  const path = `/property/${slug}`;

  const [row, catalog] = await Promise.all([
    id ? getCachedPropertyById(id) : Promise.resolve(undefined),
    getCachedProperties(),
  ]);

  return (
    <>
      {row ? <JsonLd data={buildRealEstateListingJsonLd(row, path)} /> : null}
      {row ? <PropertyListingArticle property={row} /> : null}
      <PropertyDetail initialProperty={row} initialProperties={catalog} />
    </>
  );
}
