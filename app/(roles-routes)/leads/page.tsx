"use client";

import { useAuth } from "@/contexts/auth-context";
import AgentLeads from "@/modules/agent/AgentLeads";
import VendorLeads from "@/modules/vendor/VendorLeads";

export default function Page() {
  const { user, isAuthReady } = useAuth();
  if (!isAuthReady || !user) return null;
  if (user.role === "vendor") return <VendorLeads />;
  return <AgentLeads />;
}
