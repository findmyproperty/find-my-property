import { z } from "zod";

export const vendorCategorySchema = z.enum([
  "real_estate",
  "home_services",
  "packers",
  "lawyer",
  "ca",
  "web_designer",
  "trainer",
  "tutor",
  "other",
]);

export const vendorVerificationStatusSchema = z.enum([
  "pending",
  "verified",
  "rejected",
]);

export const vendorKycDocumentsSchema = z.object({
  aadhaarUrl: z.string().nullable().optional(),
  panUrl: z.string().nullable().optional(),
  gstUrl: z.string().nullable().optional(),
  businessProofUrl: z.string().nullable().optional(),
  addressProofUrl: z.string().nullable().optional(),
});

export const vendorProfileSchema = z.object({
  id: z.number(),
  userId: z.number(),
  businessName: z.string().nullable(),
  category: vendorCategorySchema,
  verificationStatus: vendorVerificationStatusSchema,
  rejectionReason: z.string().nullable(),
  documents: vendorKycDocumentsSchema.nullable(),
  experience: z.string().nullable(),
  serviceLocations: z.array(z.string()).nullable(),
  about: z.string().nullable(),
  workingHours: z.string().nullable(),
  publicPhotoUrls: z.array(z.string()).nullable().optional(),
  certificateUrls: z.array(z.string()).nullable().optional(),
  slug: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  user: z
    .object({
      id: z.number(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      isActive: z.boolean(),
    })
    .optional(),
});

export type VendorProfile = z.infer<typeof vendorProfileSchema>;
export type VendorCategory = z.infer<typeof vendorCategorySchema>;

export const vendorProfileUpdateSchema = z.object({
  businessName: z.string().max(160).optional(),
  category: vendorCategorySchema.optional(),
  documents: vendorKycDocumentsSchema.optional(),
  experience: z.string().max(4000).optional(),
  serviceLocations: z.array(z.string()).optional(),
  about: z.string().max(4000).optional(),
  workingHours: z.string().max(255).optional(),
  publicPhotoUrls: z.array(z.string()).optional(),
  certificateUrls: z.array(z.string()).optional(),
  slug: z
    .union([
      z.literal(""),
      z
        .string()
        .max(80)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, hyphens"),
    ])
    .nullable()
    .optional(),
});

export const publicVendorProfileSchema = z.object({
  userId: z.number(),
  businessName: z.string().nullable(),
  category: vendorCategorySchema,
  about: z.string().nullable(),
  experience: z.string().nullable(),
  serviceLocations: z.array(z.string()).nullable(),
  workingHours: z.string().nullable(),
  publicPhotoUrls: z.array(z.string()).nullable(),
  certificateUrls: z.array(z.string()).nullable(),
  completedJobsCount: z.number(),
  slug: z.string().nullable(),
});

export type PublicVendorProfile = z.infer<typeof publicVendorProfileSchema>;

export type VendorProfileUpdate = z.infer<typeof vendorProfileUpdateSchema>;
