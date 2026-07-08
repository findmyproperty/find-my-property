import { format } from "date-fns";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

const MOVE_TYPE_LABELS: Record<string, string> = {
  home: "Home shifting",
  office: "Office shifting",
  vehicle: "Vehicle transport",
};

const BHK_LABELS: Record<string, string> = {
  "1rk": "1 RK",
  "1": "1 BHK",
  "2": "2 BHK",
  "3": "3 BHK",
  "4+": "4+ BHK",
};

const SERVICE_SUBTYPE_LABELS: Record<string, string> = {
  full_painting: "Full home painting",
  partial_painting: "Partial painting",
  deep_cleaning: "Deep cleaning",
  bathroom_cleaning: "Bathroom cleaning",
  sofa_cleaning: "Sofa cleaning",
  kitchen_cleaning: "Kitchen cleaning",
  carpenter: "Carpenter",
  plumber: "Plumber",
  electrician: "Electrician",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby shower",
  corporate: "Corporate event",
};

export type VendorLeadServiceSummary = {
  title: string;
  detail?: string;
};

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function getVendorLeadServiceSummary(
  requirement: string | null,
): VendorLeadServiceSummary {
  if (!requirement?.trim()) {
    return { title: "General enquiry" };
  }

  try {
    const parsed: unknown = JSON.parse(requirement);
    if (!isRecord(parsed)) {
      return { title: truncate(requirement, 48) };
    }

    if ("moveType" in parsed || "pickup" in parsed || "drops" in parsed) {
      const moveType = str(parsed.moveType);
      const bhk = str(parsed.bhk);
      return {
        title: moveType
          ? (MOVE_TYPE_LABELS[moveType] ?? "Packers & movers")
          : "Packers & movers",
        detail: bhk ? (BHK_LABELS[bhk] ?? bhk) : undefined,
      };
    }

    if ("eventType" in parsed || "guestCount" in parsed) {
      const eventType = str(parsed.eventType);
      const guests = num(parsed.guestCount);
      return {
        title: eventType
          ? (EVENT_TYPE_LABELS[eventType] ?? "Event management")
          : "Event management",
        detail: guests != null ? `${guests} guests` : undefined,
      };
    }

    if ("subType" in parsed) {
      const subType = str(parsed.subType);
      const size = str(parsed.bhkOrSqft);
      return {
        title: subType
          ? (SERVICE_SUBTYPE_LABELS[subType] ?? subType.replaceAll("_", " "))
          : "Home service",
        detail: size || undefined,
      };
    }

    return { title: "Service request" };
  } catch {
    return { title: truncate(requirement, 48) };
  }
}

export function formatVendorLeadPreferredDate(preferredDate: string | null): string {
  if (!preferredDate?.trim()) return "Flexible";
  const date = new Date(preferredDate);
  if (Number.isNaN(date.getTime())) return preferredDate;
  return format(date, "dd MMM yyyy");
}

export function formatVendorLeadJobAmount(
  jobAmount: number | null | undefined,
): string {
  if (jobAmount == null || jobAmount <= 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(jobAmount);
}
