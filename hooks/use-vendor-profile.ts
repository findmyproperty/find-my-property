"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VendorProfileUpdate } from "@/schema/vendor";
import { useAuth } from "@/contexts/auth-context";

export function useVendorProfile() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["vendor-profile", user?.id],
    queryFn: () => api.vendors.getProfile(),
    enabled: isAuthReady && user?.role === "vendor",
  });
}

export function useUpdateVendorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorProfileUpdate) => api.vendors.updateProfile(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendor-profile"] });
    },
  });
}
