"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ServiceType } from "@/end-points/service-requests";

export function usePublicVendorOptions({
  serviceType,
  category,
  enabled = true,
}: {
  serviceType: ServiceType;
  category?: string | null;
  enabled?: boolean;
}) {
  const normalizedCategory = category?.trim() || "";

  return useQuery({
    queryKey: ["public-vendor-options", serviceType, normalizedCategory],
    queryFn: () =>
      api.vendors.listPublicSelect({
        serviceType,
        category: normalizedCategory || undefined,
      }),
    enabled: enabled && !!normalizedCategory,
    staleTime: 30_000,
  });
}
