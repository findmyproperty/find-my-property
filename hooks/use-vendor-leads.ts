"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VendorLeadStatus } from "@/schema/vendor-lead";
import type {
  AdminCreateVendorLeadInput,
  AdminPatchVendorLeadInput,
  AdminListVendorLeadsQuery,
} from "@/end-points/vendor-leads";
import { useAuth } from "@/contexts/auth-context";

export function useVendorLeads() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["vendor-leads"],
    queryFn: () => api.vendorLeads.listMine(),
    enabled: isAuthReady && user?.role === "vendor",
  });
}

export function useVendorLead(id: number | null) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["vendor-lead", id],
    queryFn: () => api.vendorLeads.getOne(id!),
    enabled: isAuthReady && user?.role === "vendor" && id != null,
  });
}

export function usePatchVendorLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: VendorLeadStatus }) =>
      api.vendorLeads.patchStatus(id, status),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["vendor-leads"] });
      void qc.invalidateQueries({ queryKey: ["vendor-lead", id] });
    },
  });
}

export function useAddVendorLeadUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      milestone,
      note,
      photoUrls,
    }: {
      id: number;
      milestone: string;
      note?: string;
      photoUrls?: string[];
    }) => api.vendorLeads.addUpdate(id, { milestone, note, photoUrls }),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["vendor-lead", id] });
      void qc.invalidateQueries({ queryKey: ["vendor-leads"] });
    },
  });
}

export function useAdminVendorLeads(query: AdminListVendorLeadsQuery = {}) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-vendor-leads", query],
    queryFn: () => api.vendorLeads.listLeadsAdmin(query),
    enabled: isAuthReady && user?.role === "admin",
  });
}

export function useAdminVendorLead(id: number | null) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-vendor-lead", id],
    queryFn: () => api.vendorLeads.getLeadAdmin(id!),
    enabled: isAuthReady && user?.role === "admin" && id != null,
  });
}

export function useAdminVendorLeadByServiceRequest(serviceRequestId: number | null) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-vendor-lead-by-sr", serviceRequestId],
    queryFn: async () => {
      const result = await api.vendorLeads.listLeadsAdmin({
        serviceRequestId: serviceRequestId!,
        limit: 1,
      });
      return result.items[0] ?? null;
    },
    enabled: isAuthReady && user?.role === "admin" && serviceRequestId != null,
  });
}

export function useAdminVendors(
  query: Parameters<typeof api.vendors.listVendorsAdmin>[0] = {},
) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-vendors", query],
    queryFn: () => api.vendors.listVendorsAdmin(query),
    enabled: isAuthReady && user?.role === "admin",
  });
}

export function useAdminVendorSelect() {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: ["admin-vendors-select"],
    queryFn: () => api.vendors.adminSelect(),
    enabled: isAuthReady && user?.role === "admin",
  });
}

export function useAdminUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: number;
      input: Parameters<typeof api.vendors.adminUpdate>[1];
    }) => api.vendors.adminUpdate(userId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-vendors"] });
      void qc.invalidateQueries({ queryKey: ["admin-vendors-select"] });
    },
  });
}

export function useAdminCreateVendorLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminCreateVendorLeadInput) =>
      api.vendorLeads.adminCreate(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-vendor-leads"] });
    },
  });
}

export function useAdminPatchVendorLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AdminPatchVendorLeadInput }) =>
      api.vendorLeads.adminPatch(id, input),
    onSuccess: (updatedLead, { id }) => {
      void qc.invalidateQueries({ queryKey: ["admin-vendor-leads"] });
      void qc.invalidateQueries({ queryKey: ["admin-vendor-lead", id] });
      const vuid = updatedLead?.vendorUserId;
      if (vuid) {
        void qc.invalidateQueries({ queryKey: ["admin-vendor-wallet-summary", vuid] });
        void qc.invalidateQueries({ queryKey: ["admin-vendor-wallet-entries", vuid] });
      }
    },
  });
}

export function useAdminReopenVendorLeadSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.vendorLeads.adminReopenSettlement(id, { reason }),
    onSuccess: (updatedLead, { id }) => {
      void qc.invalidateQueries({ queryKey: ["admin-vendor-leads"] });
      void qc.invalidateQueries({ queryKey: ["admin-vendor-lead", id] });
      const vuid = updatedLead?.vendorUserId;
      if (vuid) {
        void qc.invalidateQueries({ queryKey: ["admin-vendor-wallet-summary", vuid] });
        void qc.invalidateQueries({ queryKey: ["admin-vendor-wallet-entries", vuid] });
      }
    },
  });
}

export function useAdminApproveVendorLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      api.vendorLeads.adminApproveLead(id, { notes }),
    onSuccess: (updated, { id }) => {
      void qc.invalidateQueries({ queryKey: ["admin-vendor-leads"] });
      void qc.invalidateQueries({ queryKey: ["admin-vendor-lead", id] });
      if (updated.serviceRequestId != null) {
        void qc.invalidateQueries({
          queryKey: ["admin-vendor-lead-by-sr", updated.serviceRequestId],
        });
      }
    },
  });
}

export function useAdminRejectVendorLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.vendorLeads.adminRejectLead(id, { reason }),
    onSuccess: (updated, { id }) => {
      void qc.invalidateQueries({ queryKey: ["admin-vendor-leads"] });
      void qc.invalidateQueries({ queryKey: ["admin-vendor-lead", id] });
      if (updated.serviceRequestId != null) {
        void qc.invalidateQueries({
          queryKey: ["admin-vendor-lead-by-sr", updated.serviceRequestId],
        });
      }
    },
  });
}
