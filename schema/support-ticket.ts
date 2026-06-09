import { z } from "zod";

export const supportTicketCategorySchema = z.enum([
  "general",
  "payment_query",
  "complaint",
]);

export const supportTicketStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
]);

export const supportTicketSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userRole: z.string(),
  category: supportTicketCategorySchema,
  subject: z.string(),
  body: z.string(),
  status: supportTicketStatusSchema,
  adminNotes: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  user: z
    .object({
      name: z.string().nullable(),
      phone: z.string().nullable(),
    })
    .optional(),
});

export type SupportTicket = z.infer<typeof supportTicketSchema>;
export type SupportTicketCategory = z.infer<typeof supportTicketCategorySchema>;
export type SupportTicketStatus = z.infer<typeof supportTicketStatusSchema>;

export const createSupportTicketSchema = z.object({
  category: supportTicketCategorySchema,
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
