import type { VendorLead, VendorLeadStatus } from "@/schema/vendor-lead";
import { getStoredToken, request } from "@/end-points/http";

export interface AdminCreateVendorLeadInput {
  vendorUserId: number;
  serviceRequestId?: number;
  customerName: string;
  phone: string;
  area?: string;
  budget?: string;
  requirement?: string;
  preferredDate?: string;
}

export interface AdminPatchVendorLeadInput {
  vendorUserId?: number;
  status?: VendorLeadStatus;
  jobAmount?: number | null;
}

export interface AdminListVendorLeadsQuery {
  status?: VendorLeadStatus;
  page?: number;
  limit?: number;
}

export interface AdminListVendorLeadsResponse {
  items: VendorLead[];
  total: number;
  page: number;
  limit: number;
}

export const vendorLeads = {
  async listMine(): Promise<VendorLead[]> {
    const rows = await request<VendorLead[]>("/vendor-leads", {
      method: "GET",
      token: getStoredToken(),
    });
    return Array.isArray(rows) ? rows : [];
  },

  async getOne(id: number): Promise<VendorLead> {
    return request<VendorLead>(`/vendor-leads/${id}`, {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async patchStatus(id: number, status: VendorLeadStatus): Promise<VendorLead> {
    return request<VendorLead>(`/vendor-leads/${id}`, {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify({ status }),
    });
  },

  async addUpdate(
    id: number,
    input: { milestone: string; note?: string; photoUrls?: string[] },
  ): Promise<VendorLead["updates"] extends (infer U)[] | undefined ? U : never> {
    return request(`/vendor-leads/${id}/updates`, {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },

  async listLeadsAdmin(query: AdminListVendorLeadsQuery = {}): Promise<AdminListVendorLeadsResponse> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<AdminListVendorLeadsResponse>(
      `/admin/vendor-leads${qs ? `?${qs}` : ""}`,
      { method: "GET", token: getStoredToken() },
    );
  },

  async adminCreate(input: AdminCreateVendorLeadInput): Promise<VendorLead> {
    return request<VendorLead>("/admin/vendor-leads", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },

  async adminPatch(id: number, input: AdminPatchVendorLeadInput): Promise<VendorLead> {
    return request<VendorLead>(`/admin/vendor-leads/${id}`, {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },
};
