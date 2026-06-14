"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CreateAdminTopUpInput,
  VerifyAdminTopUpInput,
} from "@/end-points/admin-wallet";
import { useAuth } from "@/contexts/auth-context";

export function useAdminWalletSummary() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-wallet-summary"],
    queryFn: () => api.adminWallet.getSummary(),
    enabled: isAuthReady && user?.role === "admin",
  });
}

export function useAdminWalletEntries(page = 1) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-wallet-entries", page],
    queryFn: () => api.adminWallet.listEntries(page),
    enabled: isAuthReady && user?.role === "admin",
  });
}

export function useCreateAdminTopUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminTopUpInput) => api.adminWallet.createTopUp(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-wallet-summary"] });
      void qc.invalidateQueries({ queryKey: ["admin-wallet-entries"] });
    },
  });
}

export function useVerifyAdminTopUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VerifyAdminTopUpInput) => api.adminWallet.verifyTopUp(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-wallet-summary"] });
      void qc.invalidateQueries({ queryKey: ["admin-wallet-entries"] });
    },
  });
}
