import type { ListingType, PropertyStatus, PropertyType } from "@/schema/property";
import type { UserRole } from "@/schema/user";

/**
 * Furnishing — not yet on `PropertyRow`; kept for UI until API adds it.
 */
export type FurnishingStatus = "furnished" | "semi-furnished" | "unfurnished";

/**
 * Client / UI shape produced only by `mapBackendProperty` in `property-mapper.ts`.
 *
 * - Persistence & API types: `PropertyRow`, `PropertyWithRelations` (`@/schema/property`).
 * - Do not duplicate this shape on components; import `Property` from here (or re-exports).
 */
export type Property = {
  id: string;
  title: string;
  /** Full display line from address + area + city */
  location: string;
  /** Structured fields from API — power browse filters */
  locality: string;
  city: string;
  price: string;
  priceLabel: string;
  priceValue: number;
  /** Derived for filters (rent vs sale) */
  type: "rent" | "buy";
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  image: string;
  images?: string[];
  isVerified?: boolean;
  ownerName?: string;
  ownerPhone?: string;
  /** Role of the user who created / owns the listing (`creator.role` from API). */
  ownerRole?: UserRole;
  agentName?: string;
  agentPhone?: string;
  furnishing: FurnishingStatus;
  assignedAgentId?: number | null;
  lat?: number;
  lng?: number;
  amenities?: string[];
  description?: string | null;
  floorPlans?: Array<{
    floorName: string;
    customName?: string;
    rooms?: number;
    bathrooms?: number;
    imageUrl: string;
  }>;
  videoUrl?: string | null;
  yearBuilt?: number;
};
