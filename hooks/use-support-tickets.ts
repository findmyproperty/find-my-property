"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateSupportTicketInput } from "@/schema/support-ticket";
import type {
  AdminListSupportTicketsQuery,
  AdminPatchSupportTicketInput,
} from "@/end-points/support-tickets";
import { useAuth } from "@/contexts/auth-context";

export function useMySupportTickets() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["support-tickets", "mine"],
    queryFn: () => api.supportTickets.listMine(),
    enabled:
      isAuthReady &&
      !!user &&
      (user.role === "vendor" || user.role === "tenant" || user.role === "agent"),
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupportTicketInput) =>
      api.supportTickets.createMine(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["support-tickets", "mine"] });
    },
  });
}

export function useAdminSupportTickets(query: AdminListSupportTicketsQuery = {}) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["support-tickets", "admin", query],
    queryFn: () => api.supportTickets.listAdmin(query),
    enabled: isAuthReady && user?.role === "admin",
  });
}

export function useAdminPatchSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: AdminPatchSupportTicketInput;
    }) => api.supportTickets.adminPatch(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["support-tickets", "admin"] });
    },
  });
}
