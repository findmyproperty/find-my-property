import { z } from "zod";

/**
 * Application settings (API / UI shape, camelCase).
 * Maps the persisted `settings` row; DB columns use snake_case on the backend.
 */
// Accept E.164 / common international formats with an optional leading +.
// Keep lenient to match what users typically paste; the backend enforces a
// stricter pattern as the authoritative check.
const phoneLike = z
  .string()
  .trim()
  .regex(/^[+]?[0-9 ()\-]{6,30}$/, "Enter a valid phone number");

export const settingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required").max(255),
  supportEmail: z.string().email(),
  supportPhone: phoneLike.nullish(),
  autoApproveListings: z.boolean(),
  newAgentRegistration: z.boolean(),
  theme: z.string(),
  primaryLogoUrl: z.string().url().nullish(),
  faviconUrl: z.string().url().nullish(),
  cloudinaryApiKey: z.string().nullish(),
  googleMapsKey: z.string().nullish(),
  twoFactorAuthEnforced: z.boolean(),
  vendorCommissionPercent: z.coerce.number().min(0).max(100).optional(),
  landingReactionCount: z.coerce.number().int().min(0).max(12),
  landingReactionIds: z.array(z.number().int()).default([]),
  faqs: z
    .array(
      z.object({
        id: z.string(),
        question: z.string().min(1, "Question is required"),
        answer: z.string().min(1, "Answer is required"),
      })
    )
    .nullish()
    .transform((val) => val ?? []),
});

export type Settings = z.infer<typeof settingsSchema>;

/** PATCH `/settings` — all fields optional. */
export const settingsUpdateSchema = settingsSchema.partial();

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;

/** Optional persisted metadata when the API includes a row id / revision time. */
export const settingsRowSchema = settingsSchema.extend({
  id: z.number().int(),
  updatedAt: z.union([z.coerce.date(), z.string()]),
});

export type SettingsRow = z.infer<typeof settingsRowSchema>;
