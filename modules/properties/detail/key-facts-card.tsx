"use client";

import { motion } from "framer-motion";
import { Bath, Bed, Calendar, Square } from "lucide-react";
import type { Property } from "@/components/property/PropertyCard";
import type { ListingFact } from "@/lib/property-posting";

type KeyFactsCardProps = {
  property: Pick<Property, "bedrooms" | "bathrooms" | "area" | "yearBuilt">;
  facts?: ListingFact[];
  embedded?: boolean;
};

/** Compact grid: beds, baths, area, year built — or category facts when a sector is set. */
export function KeyFactsCard({ property, facts, embedded }: KeyFactsCardProps) {
  const items = facts
    ? facts.map((fact) => ({
        icon: fact.icon === "bed" ? Bed : fact.icon === "bath" ? Bath : fact.icon === "area" ? Square : Calendar,
        value: fact.text,
        label:
          fact.icon === "bed"
            ? "Rooms"
            : fact.icon === "bath"
              ? "Bathrooms"
              : fact.icon === "area"
                ? "Area"
                : "Detail",
      }))
    : [
        { icon: Bed, value: `${property.bedrooms} BHK`, label: "Rooms" },
        { icon: Bath, value: `${property.bathrooms}+`, label: "Bathrooms" },
        { icon: Square, value: property.area, label: "Area" },
        {
          icon: Calendar,
          value: property.yearBuilt != null ? String(property.yearBuilt) : "—",
          label: "Year Built",
        },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        embedded
          ? "grid grid-cols-2 gap-4 sm:grid-cols-4"
          : "grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3 lg:grid-cols-4"
      }
    >
      {items.map((item, index) => (
        <div key={`${item.label}-${item.value}-${index}`} className="flex items-center gap-3">
          <item.icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
