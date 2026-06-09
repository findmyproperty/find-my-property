"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminPayoutInput } from "@/end-points/vendor-wallet";
import { useAuth } from "@/contexts/auth-context";

export function useVendorWalletSummary() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["vendor-wallet-summary"],
    queryFn: () => api.vendorWallet.getSummary(),
    enabled: isAuthReady && user?.role === "vendor",
  });
}

export function useVendorWalletEntries(page = 1) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["vendor-wallet-entries", page],
    queryFn: () => api.vendorWallet.listEntries(page),
    enabled: isAuthReady && user?.role === "vendor",
  });
}

export function useAdminVendorWalletSummary(vendorUserId: number | null) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-vendor-wallet-summary", vendorUserId],
    queryFn: () => api.vendorWallet.adminSummary(vendorUserId!),
    enabled: isAuthReady && user?.role === "admin" && vendorUserId != null,
  });
}

export function useAdminVendorWalletEntries(vendorUserId: number | null, page = 1) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-vendor-wallet-entries", vendorUserId, page],
    queryFn: () => api.vendorWallet.adminEntries(vendorUserId!, page),
    enabled: isAuthReady && user?.role === "admin" && vendorUserId != null,
  });
}

export function useAdminVendorPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminPayoutInput) => api.vendorWallet.adminPayout(input),
    onSuccess: (_, input) => {
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-summary", input.vendorUserId],
      });
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-entries", input.vendorUserId],
      });
    },
  });
}
