import { z } from "zod";

export const SERVICE_TYPE = {
  PACKERS_MOVERS: 'packers_movers',
  PAINTING_CLEANING: 'painting_cleaning',
  HOME_SERVICES: 'home_services',
  EVENT_MANAGEMENT: 'event_management',
  IT: 'it',
  GENERAL: 'general',
} as const;

export type ServiceType = (typeof SERVICE_TYPE)[keyof typeof SERVICE_TYPE];

/** Category used for property types or mapped to a service (packers-movers etc). */
export const categorySchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  /** Optional mapping to one of the service pages. Null/undefined = general (e.g. property types). */
  service: z.enum([
    SERVICE_TYPE.PACKERS_MOVERS,
    SERVICE_TYPE.PAINTING_CLEANING,
    SERVICE_TYPE.HOME_SERVICES,
    SERVICE_TYPE.EVENT_MANAGEMENT,
    SERVICE_TYPE.IT,
    SERVICE_TYPE.GENERAL,
  ]).nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type Category = z.infer<typeof categorySchema>;

/** Payload for creating a category (server may ignore or set timestamps). */
export const categoryCreateSchema = categorySchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    service: z.enum([
      SERVICE_TYPE.PACKERS_MOVERS,
      SERVICE_TYPE.PAINTING_CLEANING,
      SERVICE_TYPE.HOME_SERVICES,
      SERVICE_TYPE.EVENT_MANAGEMENT,
      SERVICE_TYPE.IT,
      SERVICE_TYPE.GENERAL,
    ]).nullable().optional(),
  });

export type CategoryCreate = z.infer<typeof categoryCreateSchema>;

/** Partial update payload. */
export const categoryUpdateSchema = categoryCreateSchema.partial();

export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
