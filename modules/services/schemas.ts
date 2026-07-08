import { z } from "zod";

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name (min 2 characters).")
    .max(120, "Name is too long."),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Please enter a valid phone number."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .max(160),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  addressLine: z.string().trim().max(500).optional().or(z.literal("")),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{4,8}$/, "Pincode must be 4-8 digits.")
    .optional()
    .or(z.literal("")),
  preferredDate: z.string().trim().optional().or(z.literal("")),
  preferredSlot: z
    .enum(["morning", "afternoon", "evening"])
    .optional(),
  assignedVendorUserId: z.number().int().positive({
    message: "Please select a preferred vendor.",
  }),
});

/** Geocoded location captured via Google Places Autocomplete. */
export const stopSchema = z.object({
  label: z
    .string()
    .trim()
    .min(3, "Pick a location from the suggestions.")
    .max(500),
  lat: z.number(),
  lng: z.number(),
  placeId: z.string().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type StopValue = z.infer<typeof stopSchema>;

export const packersMoversSchema = baseSchema.extend({
  // Now supports dynamic categories mapped to 'packers_movers'
  moveType: z.string().min(1, { message: "Pick a move type." }),
  bhk: z.enum(["1rk", "1", "2", "3", "4+"], {
    required_error: "Select size.",
  }),
  pickup: stopSchema.refine((v) => v.label.trim().length >= 3, {
    message: "Select a pickup location.",
  }),
  drops: z
    .array(stopSchema)
    .min(1, "Add at least one drop location.")
    .max(5, "Up to 5 drop locations are supported."),
  hasPackingMaterial: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type PackersMoversFormValues = z.infer<typeof packersMoversSchema>;

export const paintingCleaningSchema = baseSchema.extend({
  // Now supports dynamic categories mapped to 'painting_cleaning'
  subType: z.string().min(1, { message: "Pick a service." }),
  // Relaxed to support future dynamic categories (currently still uses static PROPERTY_TYPE_OPTIONS + fallback)
  propertyType: z.string().min(1, { message: "Pick a property type." }),
  bhkOrSqft: z
    .string()
    .trim()
    .min(1, "Tell us the size (e.g. 2 BHK or 950 sqft).")
    .max(60),
  location: stopSchema.refine((v) => v.label.trim().length >= 3, {
    message: "Select a service location.",
  }),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type PaintingCleaningFormValues = z.infer<
  typeof paintingCleaningSchema
>;

export const homeServicesSchema = baseSchema.extend({
  // Now supports dynamic categories mapped to 'home_services'
  subType: z.string().min(1, { message: "Pick a service." }),
  // Relaxed to support future dynamic categories (currently still uses static PROPERTY_TYPE_OPTIONS + fallback)
  propertyType: z.string().min(1, { message: "Pick a property type." }),
  bhkOrSqft: z
    .string()
    .trim()
    .min(1, "Tell us the size (e.g. 2 BHK or 950 sqft).")
    .max(60),
  location: stopSchema.refine((v) => v.label.trim().length >= 3, {
    message: "Select a service location.",
  }),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type HomeServicesFormValues = z.infer<typeof homeServicesSchema>;

export const eventManagementSchema = baseSchema.extend({
  // Now supports dynamic categories mapped to 'event_management' (with static fallback)
  eventType: z.string().min(1, { message: "Pick an event type." }),
  venueType: z.enum(["home", "banquet", "hotel", "outdoor", "office", "other"], {
    required_error: "Pick a venue type.",
  }),
  guestCount: z.coerce
    .number({ invalid_type_error: "Enter guest count." })
    .int("Guest count must be a whole number.")
    .min(1, "Enter at least 1 guest.")
    .max(100000, "Guest count is too high."),
  budgetRange: z.string().trim().max(80).optional().or(z.literal("")),
  services: z
    .array(
      z.enum([
        "decoration",
        "home_catering",
        "corporate_catering_veg_non_veg",
        "photography",
        "music",
        "hosting",
        "return_gifts",
        "venue_booking",
      ]),
    )
    .min(1, "Select at least one service."),
  location: stopSchema.refine((v) => v.label.trim().length >= 3, {
    message: "Select the event location.",
  }),
  themeOrStyle: z.string().trim().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type EventManagementFormValues = z.infer<
  typeof eventManagementSchema
>;

export const MOVE_TYPE_OPTIONS: Array<{
  value: PackersMoversFormValues["moveType"];
  label: string;
}> = [
  { value: "home", label: "Home shifting" },
  { value: "office", label: "Office shifting" },
  { value: "vehicle", label: "Vehicle transport" },
];

export const BHK_OPTIONS: Array<{
  value: PackersMoversFormValues["bhk"];
  label: string;
}> = [
  { value: "1rk", label: "1 RK" },
  { value: "1", label: "1 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4+", label: "4+ BHK" },
];

export const SUB_TYPE_OPTIONS: Array<{
  value: PaintingCleaningFormValues["subType"];
  label: string;
  group: "Painting" | "Cleaning";
}> = [
  { value: "full_painting", label: "Full home painting", group: "Painting" },
  {
    value: "partial_painting",
    label: "Partial / room painting",
    group: "Painting",
  },
  { value: "deep_cleaning", label: "Deep home cleaning", group: "Cleaning" },
  {
    value: "bathroom_cleaning",
    label: "Bathroom cleaning",
    group: "Cleaning",
  },
  { value: "sofa_cleaning", label: "Sofa / upholstery cleaning", group: "Cleaning" },
  {
    value: "kitchen_cleaning",
    label: "Kitchen deep cleaning",
    group: "Cleaning",
  },
];

export const HOME_SERVICE_TYPE_OPTIONS: Array<{
  value: HomeServicesFormValues["subType"];
  label: string;
}> = [
  { value: "carpenter", label: "Carpenter" },
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
];

export const PROPERTY_TYPE_OPTIONS: Array<{
  value: PaintingCleaningFormValues["propertyType"];
  label: string;
}> = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa / Independent house" },
  { value: "office", label: "Office / Shop" },
];

export const SLOT_OPTIONS = [
  { value: "morning", label: "Morning (8am - 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm - 4pm)" },
  { value: "evening", label: "Evening (4pm - 8pm)" },
] as const;

export const EVENT_TYPE_OPTIONS: Array<{
  value: EventManagementFormValues["eventType"];
  label: string;
  description: string;
}> = [
  {
    value: "birthday",
    label: "Birthday",
    description: "Decor, cake table, activities and food.",
  },
  {
    value: "wedding",
    label: "Wedding",
    description: "Ceremony, reception, vendors and guest flow.",
  },
  {
    value: "baby_shower",
    label: "Baby shower",
    description: "Theme setup, games, gifts and catering.",
  },
  {
    value: "corporate",
    label: "Corporate",
    description: "Team events, launches, offsites and meetings.",
  },
];

/** Service keys for category mapping (used in admin + dynamic options in service forms). */
export const SERVICE_OPTIONS = [
  { value: "packers_movers", label: "Packers & Movers" },
  { value: "painting_cleaning", label: "Painting & Cleaning" },
  { value: "home_services", label: "Home Services" },
  { value: "event_management", label: "Event Management" },
] as const;

export type ServiceKey = (typeof SERVICE_OPTIONS)[number]["value"];

export const VENUE_TYPE_OPTIONS: Array<{
  value: EventManagementFormValues["venueType"];
  label: string;
}> = [
  { value: "home", label: "Home" },
  { value: "banquet", label: "Banquet hall" },
  { value: "hotel", label: "Hotel" },
  { value: "outdoor", label: "Outdoor" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" },
];

export const BUDGET_RANGE_OPTIONS = [
  { value: "under_50000", label: "Under 50,000" },
  { value: "50000_100000", label: "50,000 - 1,00,000" },
  { value: "100000_250000", label: "1,00,000 - 2,50,000" },
  { value: "250000_500000", label: "2,50,000 - 5,00,000" },
  { value: "above_500000", label: "Above 5,00,000" },
] as const;

export const EVENT_SERVICE_OPTIONS: Array<{
  value: EventManagementFormValues["services"][number];
  label: string;
}> = [
  { value: "decoration", label: "Decoration" },
  { value: "home_catering", label: "Home catering" },
  {
    value: "corporate_catering_veg_non_veg",
    label: "Corporate catering (veg & non-veg)",
  },
  { value: "photography", label: "Photography" },
  { value: "music", label: "Music / DJ" },
  { value: "hosting", label: "Host / anchor" },
  { value: "return_gifts", label: "Return gifts" },
  { value: "venue_booking", label: "Venue booking" },
];

export const MAX_DROPS = 5;
