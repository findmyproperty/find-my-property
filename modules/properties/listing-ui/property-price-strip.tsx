"use client";

import type { ReactNode } from "react";
import type { Property } from "@/lib/property-view-model";
import { getPriceStripExtras } from "@/lib/property-detail-highlights";

type PropertyPriceStripProps = {
  property: Pick<Property, "price" | "priceLabel" | "area" | "details" | "currency" | "type">;
};

type PriceTile = {
  label: string;
  value: ReactNode;
  emphasis: boolean;
};

export function PropertyPriceStrip({ property }: PropertyPriceStripProps) {
  const { deposit, maintenance } = getPriceStripExtras(property as Property);
  const rentLabel = property.type === "rent" ? "Rent" : "Price";

  const tiles: PriceTile[] = [
    {
      label: rentLabel,
      value: (
        <>
          {property.price}
          <span className="text-sm font-semibold text-muted-foreground">
            {property.priceLabel}
          </span>
        </>
      ),
      emphasis: true,
    },
  ];
  if (deposit) tiles.push({ label: "Deposit", value: deposit, emphasis: false });
  if (maintenance) tiles.push({ label: "Maintenance", value: maintenance, emphasis: false });
  if (property.area) tiles.push({ label: "Built-up area", value: property.area, emphasis: false });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Mobile: scannable metric tiles */}
      <div className="grid grid-cols-2 gap-px bg-border sm:hidden">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="bg-card px-3.5 py-3.5"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {tile.label}
            </p>
            <p
              className={
                tile.emphasis
                  ? "mt-1 font-heading text-xl font-bold tabular-nums leading-none text-foreground"
                  : "mt-1 font-heading text-base font-semibold tabular-nums text-foreground"
              }
            >
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop / tablet: horizontal strip */}
      <div className="hidden flex-wrap items-end gap-x-8 gap-y-3 bg-muted/30 px-4 py-3 sm:flex sm:px-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {rentLabel}
          </p>
          <p className="font-heading text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {property.price}
            <span className="text-base font-semibold text-muted-foreground">
              {property.priceLabel}
            </span>
          </p>
        </div>
        {deposit ? (
          <div>
            <p className="text-xs text-muted-foreground">Deposit</p>
            <p className="font-heading text-lg font-semibold tabular-nums text-foreground">
              {deposit}
            </p>
          </div>
        ) : null}
        {maintenance ? (
          <div>
            <p className="text-xs text-muted-foreground">Maintenance</p>
            <p className="font-heading text-lg font-semibold tabular-nums text-foreground">
              {maintenance}
            </p>
          </div>
        ) : null}
        <div className="sm:ml-auto">
          <p className="text-xs text-muted-foreground">Built-up area</p>
          <p className="font-heading text-lg font-semibold text-foreground">{property.area}</p>
        </div>
      </div>
    </div>
  );
}
