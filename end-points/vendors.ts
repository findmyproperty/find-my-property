import type {
  PublicVendorProfile,
  VendorProfile,
  VendorProfileUpdate,
} from "@/schema/vendor";
import { getStoredToken, request } from "@/end-points/http";

export interface AdminListVendorsQuery {
  verificationStatus?: "pending" | "verified" | "rejected";
  page?: number;
  limit?: number;
}

export interface AdminListVendorsResponse {
  items: VendorProfile[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUpdateVendorInput {
  verificationStatus?: "pending" | "verified" | "rejected";
  rejectionReason?: string | null;
  isActive?: boolean;
}

export const vendors = {
  async getPublicProfile(idOrSlug: string): Promise<PublicVendorProfile> {
    return request<PublicVendorProfile>(`/vendors/public/${encodeURIComponent(idOrSlug)}`, {
      method: "GET",
      token: undefined,
    });
  },

  async getProfile(): Promise<VendorProfile> {
    return request<VendorProfile>("/vendors/me", {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async updateProfile(input: VendorProfileUpdate): Promise<VendorProfile> {
    return request<VendorProfile>("/vendors/me", {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },

  async listVendorsAdmin(query: AdminListVendorsQuery = {}): Promise<AdminListVendorsResponse> {
    const params = new URLSearchParams();
    if (query.verificationStatus) params.set("verificationStatus", query.verificationStatus);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<AdminListVendorsResponse>(
      `/admin/vendors${qs ? `?${qs}` : ""}`,
      { method: "GET", token: getStoredToken() },
    );
  },

  async adminSelect(): Promise<Array<{ userId: number; label: string }>> {
    return request<Array<{ userId: number; label: string }>>("/admin/vendors/select", {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async adminUpdate(userId: number, input: AdminUpdateVendorInput): Promise<VendorProfile> {
    return request<VendorProfile>(`/admin/vendors/${userId}`, {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },
};
