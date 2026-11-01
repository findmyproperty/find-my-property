"use client";

import { useQuery } from "@tanstack/react-query";
import {
  api,
  type AdminListPropertiesQuery,
  type AdminPropertyStatsQuery,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

const ADMIN_LIST_KEY = "admin";

export function useAdminPropertiesList(query: AdminListPropertiesQuery) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["properties", ADMIN_LIST_KEY, query],
    queryFn: () => api.adminListProperties(query),
    enabled: isAuthReady && user?.role === "admin",
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useAdminPropertyStats(query: AdminPropertyStatsQuery) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["properties", ADMIN_LIST_KEY, "stats", query],
    queryFn: () => api.adminPropertyStats(query),
    enabled: isAuthReady && user?.role === "admin",
    staleTime: 15_000,
  });
}

/** @deprecated Prefer `useAdminPropertiesList` for admin tables. */
export function useAdminProperties(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["properties", "raw"],
    queryFn: api.getRawProperties,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useProperties(options?: {
  enabled?: boolean;
  initialData?: Awaited<ReturnType<typeof api.getProperties>>;
}) {
  return useQuery({
    queryKey: ["properties"],
    queryFn: api.getProperties,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
  });
}

export function useMyProperties() {
  return useQuery({
    queryKey: ["properties", "my"],
    queryFn: api.getMyProperties,
    staleTime: 60_000,
  });
}

export function useProperty(
  id?: string,
  options?: { initialData?: Awaited<ReturnType<typeof api.getProperty>> },
) {
  return useQuery({
    queryKey: ["property", id],
    queryFn: () => api.getProperty(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
    initialData: options?.initialData,
  });
}
