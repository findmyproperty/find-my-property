"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type AdminListServiceRequestsQuery,
  type AdminUpdateServiceRequestInput,
  type EventManagementInput,
  type HomeServicesInput,
  type PackersMoversInput,
  type PaintingCleaningInput,
  type ServiceRequestFeedbackInput,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

const QK = {
  mine: ["service-requests", "mine"] as const,
  adminList: (q: AdminListServiceRequestsQuery) =>
    ["service-requests", "admin", q] as const,
  adminStats: ["service-requests", "admin", "stats"] as const,
};

export function useMyServiceRequests() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: QK.mine,
    queryFn: api.getMyServiceRequests,
    enabled: isAuthReady && Boolean(user),
    staleTime: 30_000,
  });
}

export function useSubmitPackersMovers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: PackersMoversInput) => api.submitPackersMovers(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.mine });
      toast({
        title: "Request received",
        description:
          "Our team will reach out shortly to confirm your Packers & Movers request.",
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

export function useSubmitPaintingCleaning() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: PaintingCleaningInput) =>
      api.submitPaintingCleaning(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.mine });
      toast({
        title: "Request received",
        description:
          "Our team will reach out shortly to confirm your Painting & Cleaning request.",
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

export function useSubmitHomeServices() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: HomeServicesInput) => api.submitHomeServices(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.mine });
      toast({
        title: "Request received",
        description:
          "Our team will reach out shortly to confirm your Home Services request.",
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

export function useSubmitEventManagement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: EventManagementInput) =>
      api.submitEventManagement(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.mine });
      toast({
        title: "Request received",
        description:
          "Our team will reach out shortly to confirm your Event Management request.",
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

export function useSubmitServiceRequestFeedback() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: ServiceRequestFeedbackInput;
    }) => api.submitServiceRequestFeedback(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.mine });
      toast({
        title: "Thanks for your feedback",
        description: "Your rating has been added to this service request.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not save feedback",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useAdminServiceRequests(query: AdminListServiceRequestsQuery) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: QK.adminList(query),
    queryFn: () => api.adminListServiceRequests(query),
    enabled: isAuthReady && user?.role === "admin",
    staleTime: 15_000,
  });
}

export function useAdminServiceRequestStats() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: QK.adminStats,
    queryFn: api.adminGetServiceRequestStats,
    enabled: isAuthReady && user?.role === "admin",
    staleTime: 30_000,
  });
}

export function useAdminUpdateServiceRequest() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: AdminUpdateServiceRequestInput;
    }) => api.adminUpdateServiceRequest(id, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["service-requests", "admin"] });
      const emailEvents = variables.input.emailNotifications?.events ?? [];
      toast({
        title: "Request updated",
        description:
          emailEvents.length > 0
            ? "Email notifications were requested for customer, vendor, and admin."
            : undefined,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update request",
        variant: "destructive",
      });
    },
  });
}
