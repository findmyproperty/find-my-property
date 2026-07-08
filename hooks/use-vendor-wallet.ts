"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { VIRTUAL_LIST_PAGE_SIZE } from "@/components/admin/virtual-infinite-list";
import type {
  AdminCreatePayoutInput,
  AdminCreditWalletInput,
  AdminPayoutInput,
  CreatePayoutAccountInput,
  CreateWithdrawalInput,
} from "@/end-points/vendor-wallet";
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

export function useAdminVendorWalletEntriesInfinite(
  vendorUserId: number | null,
  enabled = true,
) {
  const { user, isAuthReady } = useAuth();
  return useInfiniteQuery({
    queryKey: ["admin-vendor-wallet-entries", vendorUserId, "infinite"],
    queryFn: ({ pageParam }) =>
      api.vendorWallet.adminEntries(
        vendorUserId!,
        pageParam,
        VIRTUAL_LIST_PAGE_SIZE,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    enabled:
      isAuthReady && user?.role === "admin" && vendorUserId != null && enabled,
  });
}

export function useAdminVendorWithdrawals(vendorUserId: number | null, page = 1) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-vendor-withdrawals", vendorUserId, page],
    queryFn: () => api.vendorWallet.adminWithdrawals(vendorUserId!, page),
    enabled: isAuthReady && user?.role === "admin" && vendorUserId != null,
  });
}

export function useAdminVendorWithdrawalsInfinite(
  vendorUserId: number | null,
  enabled = true,
) {
  const { user, isAuthReady } = useAuth();
  return useInfiniteQuery({
    queryKey: ["admin-vendor-withdrawals", vendorUserId, "infinite"],
    queryFn: ({ pageParam }) =>
      api.vendorWallet.adminWithdrawals(
        vendorUserId!,
        pageParam,
        VIRTUAL_LIST_PAGE_SIZE,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    enabled:
      isAuthReady && user?.role === "admin" && vendorUserId != null && enabled,
  });
}

export function useVendorPayoutAccounts() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["vendor-payout-accounts"],
    queryFn: () => api.vendorWallet.listPayoutAccounts(),
    enabled: isAuthReady && user?.role === "vendor",
  });
}

export function useCreateVendorPayoutAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePayoutAccountInput) =>
      api.vendorWallet.createPayoutAccount(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendor-payout-accounts"] });
    },
  });
}

export function useCreateVendorWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWithdrawalInput) => api.vendorWallet.createWithdrawal(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendor-wallet-summary"] });
      void qc.invalidateQueries({ queryKey: ["vendor-wallet-entries"] });
      void qc.invalidateQueries({ queryKey: ["vendor-withdrawals"] });
    },
  });
}

export function useVendorWithdrawals(page = 1) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["vendor-withdrawals", page],
    queryFn: () => api.vendorWallet.listWithdrawals(page),
    enabled: isAuthReady && user?.role === "vendor",
  });
}

export function useAdminVendorPayoutAccounts(vendorUserId: number | null) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-vendor-payout-accounts", vendorUserId],
    queryFn: () => api.vendorWallet.adminPayoutAccounts(vendorUserId!),
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

export function useAdminCreditVendorWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminCreditWalletInput) =>
      api.vendorWallet.adminCreditWallet(input),
    onSuccess: (_, input) => {
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-summary", input.vendorUserId],
      });
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-entries", input.vendorUserId],
      });
      void qc.invalidateQueries({ queryKey: ["vendor-wallet-summary"] });
      void qc.invalidateQueries({ queryKey: ["vendor-wallet-entries"] });
    },
  });
}

export function useAdminSyncVendorCreditPayment(vendorUserId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ledgerEntryId: number) =>
      api.vendorWallet.adminSyncCreditPayment(ledgerEntryId),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-summary", vendorUserId],
      });
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-entries", vendorUserId],
      });
      void qc.invalidateQueries({ queryKey: ["vendor-wallet-summary"] });
      void qc.invalidateQueries({ queryKey: ["vendor-wallet-entries"] });
    },
  });
}

export function useAdminCancelVendorCreditPayment(vendorUserId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ledgerEntryId: number) =>
      api.vendorWallet.adminCancelCreditPayment(ledgerEntryId),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-summary", vendorUserId],
      });
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-entries", vendorUserId],
      });
      void qc.invalidateQueries({ queryKey: ["vendor-wallet-summary"] });
      void qc.invalidateQueries({ queryKey: ["vendor-wallet-entries"] });
    },
  });
}

export function useAdminCreateVendorPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminCreatePayoutInput) =>
      api.vendorWallet.adminCreatePayout(input),
    onSuccess: (_, input) => {
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-summary", input.vendorUserId],
      });
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-wallet-entries", input.vendorUserId],
      });
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-withdrawals", input.vendorUserId],
      });
      void qc.invalidateQueries({
        queryKey: ["admin-vendor-payout-accounts", input.vendorUserId],
      });
      void qc.invalidateQueries({ queryKey: ["admin-wallet-summary"] });
      void qc.invalidateQueries({ queryKey: ["admin-wallet-entries"] });
    },
  });
}
