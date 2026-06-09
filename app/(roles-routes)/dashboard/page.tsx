"use client";

import { useAuth } from "@/contexts/auth-context";
import TenantOverview from "@/modules/tenant/TenantOverview";
import AgentOverview from "@/modules/agent/AgentOverview";
import AdminOverview from "@/modules/admin/AdminOverview";
import VendorOverview from "@/modules/vendor/VendorOverview";

/** Single entry: picks overview module by `user.role` (see `config/roleNav` → Overview → `/dashboard`). */
export default function DashboardPage() {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) return null;
  if (!user) return null;

  switch (user.role) {
    case "admin":
      return <AdminOverview />;
    case "agent":
      return <AgentOverview />;
    case "vendor":
      return <VendorOverview />;
    default:
      return <TenantOverview />;
  }
}
