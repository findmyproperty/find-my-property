import type { Property } from "@/lib/property-view-model";
import { detailRows } from "@/lib/property-posting";

type PropertyListingArticleProps = {
  property: Property;
};

/**
 * No-JS / crawler fallback for listing copy. Interactive UI still SSRs via
 * `PropertyDetail` + `initialProperty` (so users with JS get a single h1).
 */
export function PropertyListingArticle({ property }: PropertyListingArticleProps) {
  const rows = property.propertySector
    ? detailRows(property.details ?? undefined).slice(0, 12)
    : (
        [
          property.bedrooms > 0 ? { label: "Bedrooms", value: String(property.bedrooms) } : null,
          property.bathrooms > 0 ? { label: "Bathrooms", value: String(property.bathrooms) } : null,
          property.area ? { label: "Area", value: property.area } : null,
        ] as Array<{ label: string; value: string } | null>
      ).filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <noscript>
      <article>
        <h1>{property.title}</h1>
        <p>
          {property.price}
          {property.priceLabel}
        </p>
        <p>{property.location}</p>
        {property.description ? <p>{property.description}</p> : null}
        {rows.length > 0 ? (
          <dl>
            {rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {property.amenities && property.amenities.length > 0 ? (
          <ul>
            {property.amenities.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
        ) : null}
      </article>
    </noscript>
  );
}
