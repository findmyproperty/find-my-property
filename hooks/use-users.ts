"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type AdminListUsersQuery } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

const QK = {
  adminUsers: (query: AdminListUsersQuery) => ["users", "admin", query] as const,
};

export function useAdminUsers(query: AdminListUsersQuery = {}) {
  const { user, isAuthReady } = useAuth();

  return useQuery({
    queryKey: QK.adminUsers(query),
    queryFn: () => api.adminListUsers(query),
    enabled: isAuthReady && user?.role === "admin",
    staleTime: 30_000,
  });
}
