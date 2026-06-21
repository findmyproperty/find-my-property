"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type AdminListJobConsultancyQuery,
  type AdminUpdateJobConsultancyInput,
  type JobConsultancyInput,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

const QK = {
  mine: ["job-consultancy", "mine"] as const,
  adminList: (q: AdminListJobConsultancyQuery) =>
    ["job-consultancy", "admin", q] as const,
  adminStats: ["job-consultancy", "admin", "stats"] as const,
};

export function useSubmitJobConsultancy() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: JobConsultancyInput) =>
      api.submitJobConsultancy(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.mine });
      toast({
        title: "Request received",
        description:
          "Our career consultant will reach out shortly to discuss opportunities.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not submit request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useAdminJobConsultancy(query: AdminListJobConsultancyQuery) {
  return useQuery({
    queryKey: QK.adminList(query),
    queryFn: () => api.adminListJobConsultancy(query),
    staleTime: 15_000,
  });
}

export function useAdminJobConsultancyStats() {
  return useQuery({
    queryKey: QK.adminStats,
    queryFn: api.adminJobConsultancyStats,
    staleTime: 30_000,
  });
}

export function useAdminUpdateJobConsultancy() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: AdminUpdateJobConsultancyInput;
    }) => api.adminUpdateJobConsultancy(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-consultancy", "admin"] });
      toast({ title: "Job consultancy request updated" });
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