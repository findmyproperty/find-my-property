"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/modules/properties/PropertyCard";

type DescriptionSectionProps = {
  property: Pick<
    Property,
    | "bedrooms"
    | "bathrooms"
    | "area"
    | "location"
    | "furnishing"
    | "description"
    | "listingType"
    | "propertyType"
    | "propertySector"
    | "postingType"
  >;
};

/** Long-form copy + type / house / locality badges. */
export function DescriptionSection({ property }: DescriptionSectionProps) {
  const mentionBhk =
    property.bedrooms > 0 &&
    property.propertySector !== "plot" &&
    property.propertySector !== "commercial" &&
    property.postingType !== "pg";
  const fallbackDescription = mentionBhk
    ? `This ${property.bedrooms} BHK is in ${
        property.location.split(",")[0] ?? "a prime area"
      }. It is ${property.furnishing}, spans ${property.area}, and has ${property.bathrooms} bathroom${
        property.bathrooms > 1 ? "s" : ""
      }. Add a description when editing the listing to replace this summary.`
    : `This listing is in ${property.location.split(",")[0] ?? "a prime area"}. Add a description when editing the listing to replace this summary.`;

  const body = property.description?.trim() ? property.description.trim() : fallbackDescription;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Description</h2>
      <p className="wrap-break-word text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-normal">
          {property.propertySector ? property.propertyType : property.listingType}
        </Badge>
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-normal">
          {property.propertyType}
        </Badge>
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-normal">
          {property.location.split(",")[0]}
        </Badge>
      </div>
    </motion.div>
  );
}
