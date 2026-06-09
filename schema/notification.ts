import { z } from "zod";

export const notificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.union([z.string(), z.date()]),
});

export type Notification = z.infer<typeof notificationSchema>;
