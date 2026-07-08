import { z } from "zod";

export const vendorLeadStatusSchema = z.enum([
  "new",
  "pending_admin_review",
  "open",
  "admin_rejected",
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

export const vendorLeadSettlementSchema = z.object({
  vendorLeadId: z.number(),
  netAmount: z.number(),
  commissionAmount: z.number(),
  ledgerStatus: z.string(),
  paymentLink: z
    .object({
      id: z.string(),
      shortUrl: z.string().nullable(),
      status: z.string(),
      amount: z.number(),
      currency: z.string(),
    })
    .nullable(),
  message: z.string(),
});

export type VendorLeadSettlement = z.infer<typeof vendorLeadSettlementSchema>;

export const vendorLeadSchema = z.object({
  id: z.number(),
  vendorUserId: z.number(),
  serviceRequestId: z.number().nullable(),
  customerName: z.string(),
  phone: z.string().optional(),
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
  settlement: vendorLeadSettlementSchema.optional(),
  contactAvailable: z.boolean().optional(),
  contactPhone: z.string().nullable().optional(),
  adminApprovedAt: z.union([z.string(), z.date()]).nullable().optional(),
  adminApprovedByUserId: z.number().nullable().optional(),
  adminApprovalNotes: z.string().nullable().optional(),
  adminRejectedAt: z.union([z.string(), z.date()]).nullable().optional(),
  adminRejectedByUserId: z.number().nullable().optional(),
  adminRejectionReason: z.string().nullable().optional(),
});

export type VendorLead = z.infer<typeof vendorLeadSchema>;

export function canVendorAcceptOrRejectLead(status: VendorLeadStatus): boolean {
  return status === "open" || status === "new";
}

export function canVendorPostWorkUpdate(status: VendorLeadStatus): boolean {
  return (
    status !== "new" &&
    status !== "open" &&
    status !== "pending_admin_review" &&
    status !== "admin_rejected" &&
    status !== "rejected"
  );
}
