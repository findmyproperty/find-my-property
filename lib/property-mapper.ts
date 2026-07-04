import type { Property, FurnishingStatus } from "@/lib/property-view-model";
import type { FloorPlanDto, PropertyWithRelations } from "@/schema/property";

/** API property row + optional `creator` / `agent` (see `propertyWithRelationsSchema`). */
export type BackendProperty = PropertyWithRelations;

/** Admin / filters — aligned with `propertyStatusSchema`. */
export const PropertyStatus = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

/** Legacy / fallback property type values (used when no categories loaded). */
export const LEGACY_PROPERTY_TYPES = ["House", "Apartment", "Villa", "Townhome"] as const;

/** Admin filters — aligned with `propertyTypeSchema`. Kept for compatibility. */
export const PropertyType = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  VILLA: "Villa",
  TOWNHOME: "Townhome",
} as const;

function normalizeFurnishing(raw: BackendProperty["furnishing"]): FurnishingStatus {
  if (raw === "furnished" || raw === "semi-furnished" || raw === "unfurnished") return raw;
  return "unfurnished";
}

function optionalPositiveNumber(raw: unknown): number | undefined {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function mapBackendProperty(property: BackendProperty): Property {
  const isRent = property.listingType === "Rent" || property.listingType === "Lease";

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: property.currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(property.price) || 0);

  const areaValue = Number(property.area) || 0;
  const areaSqFt = Math.round(areaValue * 10.7639);

  const images = property.propertyImages?.length ? property.propertyImages : [];
  const primaryImage = property.thumbnailUrl || images[0] || "";

  const amenities =
    property.amenities?.filter((a) => Boolean(a && String(a).trim())) ?? [];
  const floorPlans = normalizeFloorPlans(property.floorPlans);

  const creator = property.creator;
  const agent = property.agent;

  return {
    id: String(property.id),
    title: property.title || "Untitled Property",
    description: property.description ?? undefined,
    location: [property.address, property.locality, property.city].filter(Boolean).join(", "),
    locality: (property.locality ?? "").trim(),
    city: (property.city ?? "").trim(),
    price: formattedPrice,
    priceLabel: isRent ? "/month" : "",
    priceValue: Number(property.price) || 0,
    type: isRent ? "rent" : "buy",
    listingType: property.listingType,
    propertyType: property.propertyType,
    status: property.status,
    currency: property.currency,
    bedrooms: Number(property.bedrooms) || 0,
    bathrooms: Number(property.bathrooms) || 0,
    area: `${areaSqFt.toLocaleString("en-IN")} sq.ft`,
    image: primaryImage,
    images: images.length ? images : undefined,
    isVerified: property.status === PropertyStatus.APPROVED,
    furnishing: normalizeFurnishing(property.furnishing),
    ownerName: creator?.name?.trim() || "Owner",
    ownerPhone: creator?.phone?.trim() || undefined,
    ownerRole: creator?.role,
    agentName: agent?.name?.trim() || undefined,
    agentPhone: agent?.phone?.trim() || undefined,
    amenities: amenities.length ? amenities : undefined,
    floorPlans,
    videoUrl: property.videoUrl ?? undefined,
    yearBuilt: Number(property.yearBuilt) || undefined,
    assignedAgentId: property.assignedAgentId ?? null,
    ...(() => {
      const lat =
        property.latitude != null && Number.isFinite(Number(property.latitude))
          ? Number(property.latitude)
          : undefined;
      const lng =
        property.longitude != null && Number.isFinite(Number(property.longitude))
          ? Number(property.longitude)
          : undefined;
      return lat != null && lng != null ? { lat, lng } : {};
    })(),
  };
}

function normalizeFloorPlans(
  raw: BackendProperty["floorPlans"],
): Property["floorPlans"] {
  if (!raw) return undefined;
  let rows: Array<{
    floorName?: string;
    customName?: string;
    rooms?: number | string;
    bathrooms?: number | string;
    imageUrl?: string;
  }>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      rows = Array.isArray(parsed) ? parsed : [];
    } catch {
      return undefined;
    }
  } else {
    rows = raw;
  }
  const mapped: FloorPlanDto[] = rows
    .filter((fp) => fp?.imageUrl && String(fp.imageUrl).trim())
    .map((fp) => {
      const customName = fp.customName?.trim();
      const rooms = optionalPositiveNumber(fp.rooms);
      const bathrooms = optionalPositiveNumber(fp.bathrooms);

      return {
        floorName: fp.floorName?.trim() || "Floor",
        ...(customName ? { customName } : {}),
        ...(rooms ? { rooms } : {}),
        ...(bathrooms ? { bathrooms } : {}),
        imageUrl: String(fp.imageUrl).trim(),
      };
    });
  return mapped.length ? mapped : undefined;
}
