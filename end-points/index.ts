/**
 * HTTP API surface — split by domain under `./` and composed here.
 * App code should import `api` from `@/lib/api` (re-export) for a stable entry.
 */
import { auth } from "@/end-points/auth";
import { users } from "@/end-points/user";
import { agents } from "@/end-points/agents";
import { leads } from "@/end-points/leads";
import { properties } from "@/end-points/properties";
import { settings } from "@/end-points/settings";
import { systemLogs } from "@/end-points/system-logs";
import { admin } from "@/end-points/admin";
import { adminWallet } from "@/end-points/admin-wallet";
import { contact } from "@/end-points/contact";
import { serviceRequests } from "@/end-points/service-requests";
import { uploads } from "@/end-points/uploads";
import { vendors } from "@/end-points/vendors";
import { vendorLeads } from "@/end-points/vendor-leads";
import { vendorWallet } from "@/end-points/vendor-wallet";
import { notifications } from "@/end-points/notifications";
import { supportTickets } from "@/end-points/support-tickets";

export const api = {
  ...auth,
  ...users,
  ...properties,
  ...systemLogs,
  ...settings,
  ...agents,
  ...leads,
  ...admin,
  adminWallet,
  ...serviceRequests,
  ...uploads,
  vendors,
  vendorLeads,
  vendorWallet,
  notifications,
  supportTickets,
  contact,
};

export type Api = typeof api;
