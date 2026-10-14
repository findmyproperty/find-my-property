"use client";

import {
  Bath,
  Bed,
  Building2,
  Calendar,
  Car,
  Compass,
  Layers,
  Square,
  type LucideIcon,
} from "lucide-react";
import type { HighlightSpec } from "@/lib/property-detail-highlights";

function iconForLabel(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("bath")) return Bath;
  if (l.includes("bed") || l.includes("bhk") || l.includes("room")) return Bed;
  if (l.includes("parking") || l.includes("car")) return Car;
  if (l.includes("facing") || l.includes("compass")) return Compass;
  if (l.includes("floor")) return Layers;
  if (l.includes("possession") || l.includes("available") || l.includes("age")) return Calendar;
  if (l.includes("area") || l.includes("sq")) return Square;
  return Building2;
}

type SpecIconGridProps = {
  specs: HighlightSpec[];
};

export function SpecIconGrid({ specs }: SpecIconGridProps) {
  if (specs.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
      {specs.map((spec) => {
        const Icon = iconForLabel(spec.label);
        return (
          <div
            key={spec.id}
            className="flex items-start gap-3 rounded-lg border border-border/80 bg-card p-3"
          >
            <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{spec.label}</p>
              <p className="text-sm font-semibold text-foreground">{spec.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
