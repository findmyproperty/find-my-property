import type { Property } from "@/lib/property-view-model";
import { detailRows, listingFacts } from "@/lib/property-posting";

export type HighlightSpec = {
  id: string;
  label: string;
  value: string;
};

const HIGHLIGHT_LABEL_RE =
  /facing|furnish|possession|parking|available|tenant|bhk|age|floor|ownership|water|lift/i;

/** Icon-grid cells for property detail fold (facts + high-value detail fields). */
export function getPropertyHighlightSpecs(property: Property): HighlightSpec[] {
  const specs: HighlightSpec[] = [];
  const seen = new Set<string>();

  const push = (id: string, label: string, value: string) => {
    if (!value || seen.has(id)) return;
    seen.add(id);
    specs.push({ id, label, value });
  };

  for (const fact of listingFacts(property)) {
    const label =
      fact.icon === "bed"
        ? "Bedrooms"
        : fact.icon === "bath"
          ? "Bathrooms"
          : fact.icon === "area"
            ? "Area"
            : "Detail";
    push(`fact-${fact.text}`, label, fact.text);
  }

  if (property.details) {
    for (const row of detailRows(property.details)) {
      if (!HIGHLIGHT_LABEL_RE.test(row.label)) continue;
      push(`detail-${row.label}`, row.label, row.value);
      if (specs.length >= 12) break;
    }
  }

  if (!property.propertySector) {
    if (property.bedrooms > 0) push("bedrooms", "Bedrooms", String(property.bedrooms));
    if (property.bathrooms > 0) push("bathrooms", "Bathrooms", String(property.bathrooms));
    push("area", "Area", property.area);
  }

  return specs.slice(0, 12);
}

export function getPriceStripExtras(property: Property): { deposit?: string; maintenance?: string } {
  const d = property.details;
  if (!d) return {};
  const fmt = (n: unknown) => {
    const num = Number(n);
    if (!Number.isFinite(num) || num <= 0) return undefined;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: property.currency || "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };
  const deposit =
    fmt(d.securityDeposit) ??
    fmt(d.deposit) ??
    (typeof d.deposit === "string" && d.deposit.trim() ? d.deposit.trim() : undefined);
  const maintenance = fmt(d.maintenanceAmount) ?? fmt(d.maintenanceCost);
  return { deposit, maintenance };
}
