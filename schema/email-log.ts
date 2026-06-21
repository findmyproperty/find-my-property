import { z } from "zod";

export const emailLogStatusSchema = z.enum([
  "queued",
  "sent",
  "failed",
  "skipped",
]);

export const emailLogSchema = z.object({
  id: z.number(),
  templateKey: z.string(),
  feature: z.string(),
  triggerEvent: z.string(),
  recipientEmail: z.string(),
  recipientUserId: z.number().nullable(),
  recipientRole: z.string().nullable(),
  subject: z.string(),
  fromAddress: z.string(),
  replyTo: z.string().nullable(),
  entityType: z.string().nullable(),
  entityId: z.number().nullable(),
  status: emailLogStatusSchema,
  skippedReason: z.string().nullable(),
  providerMessageId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  attemptCount: z.number(),
  resendCount: z.number(),
  resentFromId: z.number().nullable(),
  triggeredByUserId: z.number().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.union([z.string(), z.date()]),
  sentAt: z.union([z.string(), z.date()]).nullable(),
});

export type EmailLog = z.infer<typeof emailLogSchema>;
export type EmailLogStatus = z.infer<typeof emailLogStatusSchema>;