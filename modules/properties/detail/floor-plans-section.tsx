"use client";

import { motion } from "framer-motion";
import type { Property } from "@/components/property/PropertyCard";

type FloorPlansSectionProps = {
  floorPlans: NonNullable<Property["floorPlans"]>;
  activeIndex: number;
  onFloorChange: (index: number) => void;
};

/** Tabs per floor + floor plan image. */
export function FloorPlansSection({ floorPlans, activeIndex, onFloorChange }: FloorPlansSectionProps) {
  if (floorPlans.length === 0) return null;

  const safeIndex = Math.min(activeIndex, floorPlans.length - 1);
  const active = floorPlans[safeIndex];
  const activeMetadata = [
    active?.rooms ? `${active.rooms} BHK` : undefined,
    active?.bathrooms ? `${active.bathrooms} Bath` : undefined,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Floor Plans</h2>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Select a floor to view its plan image from the listing.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {floorPlans.map((fp, i) => {
          const label = fp.customName || fp.floorName || `Floor ${i + 1}`;
          return (
            <button
              key={`${label}-${i}`}
              type="button"
              onClick={() => onFloorChange(i)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                safeIndex === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {active ? (
        <div className="flex flex-col gap-3">
          {activeMetadata.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
              {activeMetadata.map((item, index) => (
                <span key={item} className="flex items-center gap-2">
                  {index > 0 ? <span aria-hidden="true">&bull;</span> : null}
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          <div className="aspect-[16/10] overflow-hidden rounded-xl bg-primary/10">
            <img
              src={active.imageUrl}
              alt={active.customName || active.floorName || "Floor plan"}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
