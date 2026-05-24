import { z } from "zod";
import {
  userSchema,
  userCreateSchema,
  userPublicSchema,
} from "@/schema/user";

/** Property summary included on `GET /agents` — listings the agent created. */
export const agentAssignedPropertySchema = z.object({
  id: z.number().int(),
  title: z.string(),
});

export type AgentAssignedProperty = z.infer<typeof agentAssignedPropertySchema>;

/** User row with `role: "agent"` — same shape as {@link userSchema}, role fixed. */
export const agentSchema = userSchema.omit({ role: true }).extend({
  role: z.literal("agent"),
  properties: z.array(agentAssignedPropertySchema).optional(),
});

export type Agent = z.infer<typeof agentSchema>;

/** User row with `role: "admin"`. */
export const adminUserSchema = userSchema.omit({ role: true }).extend({
  role: z.literal("admin"),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

/** User row with `role: "tenant"`. */
export const tenantUserSchema = userSchema.omit({ role: true }).extend({
  role: z.literal("tenant"),
});

export type TenantUser = z.infer<typeof tenantUserSchema>;

/** Create payload for an agent user (no id/timestamps; role forced to agent). */
export const agentCreateSchema = userCreateSchema.omit({ role: true }).extend({
  role: z.literal("agent"),
});

export type AgentCreate = z.infer<typeof agentCreateSchema>;

export const agentUpdateSchema = agentCreateSchema.partial();

export type AgentUpdate = z.infer<typeof agentUpdateSchema>;

/** Public agent profile (no secrets). */
export const agentPublicSchema = userPublicSchema.omit({ role: true }).extend({
  role: z.literal("agent"),
  properties: z.array(agentAssignedPropertySchema).optional(),
});

export type AgentPublic = z.infer<typeof agentPublicSchema>;

/** Admin invite form — minimal fields; server sets `role: "agent"`. */
export const agentInviteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  phone: z.string().min(1, "Phone is required"),
});

export type AgentInvite = z.infer<typeof agentInviteSchema>;
