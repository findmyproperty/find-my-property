"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Bath,
  Bed,
  Building2,
  Calendar,
  Car,
  Compass,
  CreditCard,
  MapPin,
  Phone,
  Shield,
  UserRound,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PropertySection } from "@/modules/properties/listing-ui";
import { cn } from "@/lib/utils";
import { detailRows } from "@/lib/property-posting";
import type { DetailRow } from "@/lib/detail-card-groups";
import type { Property } from "@/lib/property-view-model";

type OverviewSectionProps = {
  rows: DetailRow[];
  property: Property;
  showLegacyFacts: boolean;
};

/** Shown in price strip / map — omit from overview grid. */
const OVERVIEW_HIDDEN_LABELS = new Set([
  "Directions",
  "Deposit",
  "Maintenance",
  "Maintenance cost",
  "Maintenance frequency",
  "Security deposit",
]);

function filterOverviewRows(rows: DetailRow[]): DetailRow[] {
  return rows.filter((row) => !OVERVIEW_HIDDEN_LABELS.has(row.label));
}

/** Rows shown in overview on mobile before "View more". */
const MOBILE_OVERVIEW_PREVIEW_COUNT = 6;

function iconForOverviewLabel(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("deposit") || l.includes("maintenance") || l.includes("lease")) return CreditCard;
  if (l.includes("available") || l.includes("possession")) return Calendar;
  if (l.includes("bath")) return Bath;
  if (l.includes("bhk") || l.includes("bed") || l.includes("room") || l.includes("balcony")) return Bed;
  if (l.includes("area") || l.includes("floor") || l.includes("built")) return Building2;
  if (l.includes("parking")) return Car;
  if (l.includes("facing")) return Compass;
  if (l.includes("water") || l.includes("gym") || l.includes("pet") || l.includes("furnish") || l.includes("veg")) {
    return Waves;
  }
  if (l.includes("security") || l.includes("gated")) return Shield;
  if (l.includes("direction")) return MapPin;
  if (l.includes("phone") || l.includes("number")) return Phone;
  if (l.includes("show") || l.includes("who")) return UserRound;
  return Building2;
}

const overviewValueClass =
  "ml-auto min-w-0 max-w-[min(14rem,52%)] truncate text-right text-sm font-semibold text-foreground";

function OverviewValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setTruncated(el.scrollWidth > el.clientWidth);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  if (!truncated) {
    return (
      <span ref={ref} className={overviewValueClass}>
        {value}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          ref={ref}
          className={cn(overviewValueClass, "cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-2")}
          tabIndex={0}
        >
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm whitespace-normal text-left font-normal">
        {value}
      </TooltipContent>
    </Tooltip>
  );
}

function OverviewRow({ label, value }: DetailRow) {
  const Icon = iconForOverviewLabel(label);
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-dashed border-border/80 py-3 last:border-b-0">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 shrink text-sm text-muted-foreground">{label}</span>
      <OverviewValue value={value} />
    </div>
  );
}

function legacyRows(property: Property): DetailRow[] {
  const rows: DetailRow[] = [];
  if (property.bedrooms > 0) rows.push({ label: "Bedrooms", value: String(property.bedrooms) });
  if (property.bathrooms > 0) rows.push({ label: "Bathrooms", value: String(property.bathrooms) });
  rows.push({ label: "Area", value: property.area });
  if (property.yearBuilt) rows.push({ label: "Year built", value: String(property.yearBuilt) });
  return rows;
}

export function OverviewSection({ rows, property, showLegacyFacts }: OverviewSectionProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    setMobileExpanded(false);
  }, [property.id]);

  const rawRows = showLegacyFacts
    ? legacyRows(property)
    : rows.length > 0
      ? rows
      : detailRows(property.details ?? undefined);
  const displayRows = filterOverviewRows(rawRows);

  if (displayRows.length === 0) {
    return null;
  }

  const mid = Math.ceil(displayRows.length / 2);
  const left = displayRows.slice(0, mid);
  const right = displayRows.slice(mid);
  const mobileCollapsible = displayRows.length > MOBILE_OVERVIEW_PREVIEW_COUNT;
  const mobileRows = mobileExpanded
    ? displayRows
    : displayRows.slice(0, MOBILE_OVERVIEW_PREVIEW_COUNT);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
      <PropertySection title="Overview" id="overview">
        <div className="min-w-0 md:hidden">
          {mobileRows.map((row, i) => (
            <OverviewRow key={`m-${row.label}-${i}`} {...row} />
          ))}
          {mobileCollapsible ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-8 w-full gap-1 text-primary"
              onClick={() => setMobileExpanded((v) => !v)}
            >
              {mobileExpanded ? "View less" : "View more"}
              <ChevronDown
                className={cn("size-4 transition-transform", mobileExpanded && "rotate-180")}
                aria-hidden
              />
            </Button>
          ) : null}
        </div>

        <div className="hidden min-w-0 gap-x-10 md:grid md:grid-cols-2">
          <div className="min-w-0">
            {left.map((row, i) => (
              <OverviewRow key={`l-${row.label}-${i}`} {...row} />
            ))}
          </div>
          <div className="min-w-0">
            {right.map((row, i) => (
              <OverviewRow key={`r-${row.label}-${i}`} {...row} />
            ))}
          </div>
        </div>
      </PropertySection>
    </motion.div>
  );
}
