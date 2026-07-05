"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePublicVendorOptions({
  categoryId,
  enabled = true,
}: {
  categoryId?: string | number | null;
  enabled?: boolean;
}) {
  const normalizedCategoryId = categoryId?.toString().trim() || "";

  return useQuery({
    queryKey: ["public-vendor-options", normalizedCategoryId],
    queryFn: () => api.vendors.listPublicSelect({ categoryId: normalizedCategoryId || undefined }),
    enabled: enabled && !!normalizedCategoryId,
    staleTime: 30_000,
  });
}
