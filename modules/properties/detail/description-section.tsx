"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertySection } from "@/modules/properties/listing-ui";
import type { Property } from "@/modules/properties/PropertyCard";
import { cn } from "@/lib/utils";

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
  const [expanded, setExpanded] = useState(false);
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
  const long = body.length > 320;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <PropertySection title="Description">
        <p
          className={cn(
            "wrap-break-word text-sm leading-relaxed text-muted-foreground",
            !expanded && long && "line-clamp-4",
          )}
        >
          {body}
        </p>
        {long ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-8 gap-1 px-0 text-primary"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : "Show more"}
            <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
          </Button>
        ) : null}
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
      </PropertySection>
    </motion.div>
  );
}
