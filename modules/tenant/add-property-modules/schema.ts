import { z } from "zod";
import type { BackendProperty } from "@/lib/property-mapper";

const listingTypeOptions = ["Rent", "Sale", "Lease"] as const;

const furnishingOptions = ["furnished", "semi-furnished", "unfurnished"] as const;

type ListingTypeOption = (typeof listingTypeOptions)[number];
type FurnishingOption = (typeof furnishingOptions)[number];

const isListingTypeOption = (value: string): value is ListingTypeOption =>
  listingTypeOptions.includes(value as ListingTypeOption);

const isFurnishingOption = (value: string): value is FurnishingOption =>
  (furnishingOptions as readonly string[]).includes(value);

const emptyFloorPlan = {
  id: "1",
  floorName: "ground",
  customName: "",
  rooms: "",
  bathrooms: "",
  imageUrl: "",
};

export const propertyFormSchema = z.object({
  // Accepts any non-empty string; populated dynamically from admin-managed categories
  propertyType: z.string().min(1, { message: "Please select a property type." }),
  listingType: z.enum(listingTypeOptions, {
    required_error: "Please select a listing type.",
  }),
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title is too long."),

  bedrooms: z.string().min(1, "Please select number of bedrooms."),
  bathrooms: z.string().min(1, "Please select number of bathrooms."),
  area: z.string().min(1, "Area is required."),
  yearBuilt: z.coerce.number().min(1900, "Year must be 1900 or later.").max(new Date().getFullYear() + 5, "Year cannot be too far in the future."),
  price: z.coerce.number().min(1, "Price must be greater than 0."),

  furnishing: z.enum(furnishingOptions, {
    required_error: "Please select furnishing status.",
  }),

  address: z.string().min(5, "Address must be at least 5 characters."),
  locality: z.string().min(2, "Locality is required."),
  city: z.string().min(2, "City is required."),
  state: z.string().optional(),
  country: z.string().min(2, "Country is required."),

  description: z.string().optional(),

  amenities: z.array(z.string()).default([]),

  videoUrl: z.string().optional(),

  propertyImages: z.array(z.string()).default([]),
  thumbnailUrl: z.string().optional(),

  floorPlans: z
    .array(
      z.object({
        id: z.string(),
        floorName: z.string(),
        customName: z.string().optional(),
        rooms: z.string(),
        bathrooms: z.string(),
        imageUrl: z.string(),
      }).superRefine((floorPlan, ctx) => {
        if (!floorPlan.imageUrl.trim()) return;

        if (!floorPlan.rooms.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select rooms for this floor plan.",
            path: ["rooms"],
          });
        }

        if (!floorPlan.bathrooms.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select bathrooms for this floor plan.",
            path: ["bathrooms"],
          });
        }
      }),
    )
    .default([]),

  /** Set by admins only in the UI; optional on create/update */
  assignedAgentId: z.string().optional(),

  /** Map pin — saved with listing for browse map markers */
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

/** Map `BackendProperty` (`PropertyWithRelations` / `PropertyRow` + relations) into form defaults. */
export const getDefaultValues = (initialData?: BackendProperty): Partial<PropertyFormValues> => {
  // propertyType is now free-form string (from admin categories). Fall back to a common default.
  const propertyType = initialData?.propertyType?.trim() || "Apartment";
  const listingType =
    initialData?.listingType && isListingTypeOption(initialData.listingType)
      ? initialData.listingType
      : "Rent";

  const areaSqFt =
    initialData?.area != null ? Math.round(Number(initialData.area) * 10.7639) : undefined;

  const floorPlansFromApi = initialData?.floorPlans;
  let floorPlans: PropertyFormValues["floorPlans"];
  if (floorPlansFromApi && Array.isArray(floorPlansFromApi) && floorPlansFromApi.length > 0) {
    floorPlans = floorPlansFromApi.map((fp, idx) => ({
      id: fp.id ?? String(idx + 1),
      floorName: fp.floorName || "ground",
      customName: fp.customName ?? "",
      rooms: fp.rooms != null ? String(fp.rooms) : "",
      bathrooms: fp.bathrooms != null ? String(fp.bathrooms) : "",
      imageUrl: fp.imageUrl ?? "",
    }));
  } else if (typeof floorPlansFromApi === "string") {
    try {
      const parsed = JSON.parse(floorPlansFromApi) as unknown;
      const arr = Array.isArray(parsed) ? parsed : [];
      floorPlans = arr.map((fp: Record<string, string | number>, idx: number) => ({
        id: fp.id != null ? String(fp.id) : String(idx + 1),
        floorName: String(fp.floorName || "ground"),
        customName: fp.customName != null ? String(fp.customName) : "",
        rooms: fp.rooms != null ? String(fp.rooms) : "",
        bathrooms: fp.bathrooms != null ? String(fp.bathrooms) : "",
        imageUrl: fp.imageUrl != null ? String(fp.imageUrl) : "",
      }));
    } catch {
      floorPlans = [emptyFloorPlan];
    }
  } else {
    floorPlans = [emptyFloorPlan];
  }

  const images = initialData?.propertyImages?.length ? initialData.propertyImages : [];

  return {
    propertyType,
    listingType,
    title: initialData?.title || "",
    bedrooms: initialData?.bedrooms != null ? String(initialData.bedrooms) : "",
    bathrooms: initialData?.bathrooms != null ? String(initialData.bathrooms) : "",
    area: areaSqFt != null ? String(areaSqFt) : "",
    yearBuilt: initialData?.yearBuilt ?? new Date().getFullYear(),
    price: initialData?.price ?? 0,
    furnishing:
      initialData?.furnishing != null && isFurnishingOption(initialData.furnishing)
        ? initialData.furnishing
        : "unfurnished",
    address: initialData?.address || "",
    locality: initialData?.locality || "",
    city: initialData?.city || "",
    state: initialData?.state ?? "",
    country: initialData?.country || "India",
    description: initialData?.description || "",
    amenities: initialData?.amenities ?? [],
    videoUrl: initialData?.videoUrl || "",
    propertyImages: images,
    thumbnailUrl: initialData?.thumbnailUrl || images[0] || "",
    floorPlans,
    assignedAgentId:
      initialData?.assignedAgentId != null && initialData.assignedAgentId > 0
        ? String(initialData.assignedAgentId)
        : "",
    latitude:
      initialData?.latitude != null && Number.isFinite(Number(initialData.latitude))
        ? Number(initialData.latitude)
        : undefined,
    longitude:
      initialData?.longitude != null && Number.isFinite(Number(initialData.longitude))
        ? Number(initialData.longitude)
        : undefined,
  };
};
