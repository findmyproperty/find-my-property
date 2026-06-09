import { z } from "zod";

export const vendorLeadStatusSchema = z.enum([
  "new",
  "accepted",
  "rejected",
  "in_progress",
  "completed",
]);

export type VendorLeadStatus = z.infer<typeof vendorLeadStatusSchema>;

export const vendorLeadUpdateSchema = z.object({
  id: z.number(),
  milestone: z.string(),
  note: z.string().nullable(),
  photoUrls: z.array(z.string()).nullable(),
  createdAt: z.union([z.string(), z.date()]),
});

export const vendorLeadSchema = z.object({
  id: z.number(),
  vendorUserId: z.number(),
  serviceRequestId: z.number().nullable(),
  customerName: z.string(),
  phone: z.string(),
  area: z.string().nullable(),
  budget: z.string().nullable(),
  requirement: z.string().nullable(),
  preferredDate: z.string().nullable(),
  status: vendorLeadStatusSchema,
  commissionPercent: z.number(),
  jobAmount: z.number().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  updates: z.array(vendorLeadUpdateSchema).optional(),
});

export type VendorLead = z.infer<typeof vendorLeadSchema>;
