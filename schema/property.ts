import { z } from "zod";
import { userPublicSchema } from "./user";

export const listingTypeSchema = z.enum(["Rent", "Sale", "Lease"]);
export type ListingType = z.infer<typeof listingTypeSchema>;

/** Property category / type. Backed by admin-managed categories (string value stored on property). */
export const propertyTypeSchema = z.string().min(1);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const propertyStatusSchema = z.enum(["Pending", "Approved", "Rejected"]);
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

/** Furnishing level — aligned with `FurnishingStatus` in `property-view-model`. */
export const furnishingStatusSchema = z.enum(["furnished", "semi-furnished", "unfurnished"]);
export type FurnishingStatus = z.infer<typeof furnishingStatusSchema>;

/** Floor plan row stored as JSON on the property. */
export const floorPlanDtoSchema = z.object({
  id: z.string().optional(),
  floorName: z.string(),
  customName: z.string().optional(),
  rooms: z.number().optional(),
  bathrooms: z.number().optional(),
  imageUrl: z.string(),
});

export type FloorPlanDto = z.infer<typeof floorPlanDtoSchema>;

/** Full property row (persisted / API entity shape). */
export const propertySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  currency: z.string(),
  listingType: listingTypeSchema,
  propertyType: propertyTypeSchema,
  address: z.string(),
  locality: z.string(),
  city: z.string(),
  state: z.string().nullable().optional(),
  country: z.string(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  area: z.number(),
  yearBuilt: z.number(),
  furnishing: furnishingStatusSchema.nullable().optional(),
  amenities: z.array(z.string()).nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  propertyImages: z.array(z.string()).nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  floorPlans: z.array(floorPlanDtoSchema).nullable().optional(),
  status: propertyStatusSchema,
  reason: z.string().nullable().optional(),
  createdBy: z.number().int().nullable().optional(),
  assignedAgentId: z.number().int().nullable().optional(),
  /** Map pin — returned by API when stored (e.g. from add-property map). */
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type PropertyRow = z.infer<typeof propertySchema>;

/** Insert payload (no primary key). */
export const propertyCreateSchema = propertySchema.omit({ id: true });

export type PropertyCreate = z.infer<typeof propertyCreateSchema>;

export const propertyUpdateSchema = propertyCreateSchema.partial();

export type PropertyUpdate = z.infer<typeof propertyUpdateSchema>;

/** User fields embedded on property API responses (creator + optional assigned agent). */
const propertyRelationUserSchema = userPublicSchema.pick({
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
});

/**
 * Full property as returned by GET /properties (row + relations).
 * Use this for `BackendProperty` / `mapBackendProperty` input.
 */
export const propertyWithRelationsSchema = propertySchema.extend({
  creator: propertyRelationUserSchema.optional(),
  agent: propertyRelationUserSchema.nullable().optional(),
});

export type PropertyWithRelations = z.infer<typeof propertyWithRelationsSchema>;
