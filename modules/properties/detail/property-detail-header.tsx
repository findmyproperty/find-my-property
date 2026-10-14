"use client";

import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/property-view-model";

type PropertyDetailHeaderProps = {
  property: Pick<Property, "title" | "location" | "categoryLabel" | "listingType">;
};

export function PropertyDetailHeader({ property }: PropertyDetailHeaderProps) {
  return (
    <header className="space-y-2">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {property.title}
      </h1>
      <p className="flex items-start gap-2 text-sm text-muted-foreground md:text-base">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        <span>{property.location}</span>
      </p>
      {property.categoryLabel ? (
        <Badge variant="outline">{property.categoryLabel}</Badge>
      ) : (
        <Badge variant="outline">{property.listingType}</Badge>
      )}
    </header>
  );
}
