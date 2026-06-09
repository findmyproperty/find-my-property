import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "agent", "tenant", "vendor"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/** Full user row (matches persisted entity shape). */
export const userSchema = z.object({
  id: z.number().int(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  password: z.string().nullable(),
  phone: z.string().nullable(),
  googleId: z.string().nullable(),
  isEmailVerified: z.boolean(),
  isPhoneVerified: z.boolean(),
  pendingEmail: z.string().nullable(),
  emailOtpHash: z.string().nullable(),
  emailOtpExpiresAt: z.union([z.coerce.date(), z.null()]),
  locationAddress: z.string().nullable(),
  locationCity: z.string().nullable(),
  locationState: z.string().nullable(),
  locationCountry: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  onboardingCompleted: z.boolean(),
  role: userRoleSchema,
  defaultRole: userRoleSchema.nullable().optional(),
  favorites: z.array(z.number().int()).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

/** Insert / create payload (no `id` or timestamps). */
export const userCreateSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserCreate = z.infer<typeof userCreateSchema>;

/** Partial update payload. */
export const userUpdateSchema = userCreateSchema.partial();

export type UserUpdate = z.infer<typeof userUpdateSchema>;

/** Safe for API responses (omit secrets). */
export const userPublicSchema = userSchema.omit({
  password: true,
  emailOtpHash: true,
  emailOtpExpiresAt: true,
});

export type UserPublic = z.infer<typeof userPublicSchema>;
