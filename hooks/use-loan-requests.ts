"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type AdminListLoanRequestsQuery,
  type AdminUpdateLoanRequestInput,
  type LoanRequestInput,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

const QK = {
  mine: ["loan-requests", "mine"] as const,
  adminList: (q: AdminListLoanRequestsQuery) =>
    ["loan-requests", "admin", q] as const,
  adminStats: ["loan-requests", "admin", "stats"] as const,
};

export function useMyLoanRequests() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: QK.mine,
    queryFn: api.getMyLoanRequests,
    enabled: isAuthReady && Boolean(user),
    staleTime: 30_000,
  });
}

export function useSubmitLoanRequest() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: LoanRequestInput) => api.submitLoanRequest(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.mine });
      toast({
        title: "Application received",
        description:
          "Our loan specialist will reach out shortly to discuss your options.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not submit application",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useAdminLoanRequests(query: AdminListLoanRequestsQuery) {
  return useQuery({
    queryKey: QK.adminList(query),
    queryFn: () => api.adminListLoanRequests(query),
    staleTime: 15_000,
  });
}

export function useAdminLoanRequestStats() {
  return useQuery({
    queryKey: QK.adminStats,
    queryFn: api.adminLoanRequestStats,
    staleTime: 30_000,
  });
}

export function useAdminUpdateLoanRequest() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: AdminUpdateLoanRequestInput;
    }) => api.adminUpdateLoanRequest(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-requests", "admin"] });
      toast({ title: "Loan request updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
}