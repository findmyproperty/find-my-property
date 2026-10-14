"use client";

import type { Property } from "@/lib/property-view-model";
import { getPriceStripExtras } from "@/lib/property-detail-highlights";

type PropertyPriceStripProps = {
  property: Pick<Property, "price" | "priceLabel" | "area" | "details" | "currency" | "type">;
};

export function PropertyPriceStrip({ property }: PropertyPriceStripProps) {
  const { deposit, maintenance } = getPriceStripExtras(property as Property);

  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-3 rounded-xl border border-border bg-muted/30 px-4 py-3 sm:px-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {property.type === "rent" ? "Rent" : "Price"}
        </p>
        <p className="font-heading text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
          {property.price}
          <span className="text-base font-semibold text-muted-foreground">{property.priceLabel}</span>
        </p>
      </div>
      {deposit ? (
        <div>
          <p className="text-xs text-muted-foreground">Deposit</p>
          <p className="font-heading text-lg font-semibold tabular-nums text-foreground">{deposit}</p>
        </div>
      ) : null}
      {maintenance ? (
        <div>
          <p className="text-xs text-muted-foreground">Maintenance</p>
          <p className="font-heading text-lg font-semibold tabular-nums text-foreground">{maintenance}</p>
        </div>
      ) : null}
      <div className="sm:ml-auto">
        <p className="text-xs text-muted-foreground">Built-up area</p>
        <p className="font-heading text-lg font-semibold text-foreground">{property.area}</p>
      </div>
    </div>
  );
}
