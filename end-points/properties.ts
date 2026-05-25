import type { Property } from "@/components/property/PropertyCard";
import { mapBackendProperty, type BackendProperty } from "@/lib/property-mapper";
import { getStoredToken, request } from "@/end-points/http";

export type AdminListPropertiesQuery = {
  q?: string;
  status?: string;
  city?: string;
  listing?: "rent" | "sale";
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
  assignedAgentId?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type AdminPropertyStatsQuery = Omit<
  AdminListPropertiesQuery,
  "status" | "sortBy" | "sortDir" | "page" | "limit"
>;

export type AdminListPropertiesResponse = {
  items: BackendProperty[];
  total: number;
  page: number;
  limit: number;
};

export type AdminPropertyStats = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

function buildAdminPropertiesQuery(
  q: AdminListPropertiesQuery | AdminPropertyStatsQuery,
): string {
  const params = new URLSearchParams();
  if (q.q?.trim()) params.set("q", q.q.trim());
  if ("status" in q && q.status) params.set("status", q.status);
  if (q.city?.trim()) params.set("city", q.city.trim());
  if (q.listing) params.set("listing", q.listing);
  if (q.propertyType?.trim()) params.set("propertyType", q.propertyType.trim());
  if (q.priceMin != null && Number.isFinite(q.priceMin)) {
    params.set("priceMin", String(q.priceMin));
  }
  if (q.priceMax != null && Number.isFinite(q.priceMax)) {
    params.set("priceMax", String(q.priceMax));
  }
  if (q.assignedAgentId != null && q.assignedAgentId > 0) {
    params.set("assignedAgentId", String(q.assignedAgentId));
  }
  if ("sortBy" in q && q.sortBy) params.set("sortBy", q.sortBy);
  if ("sortDir" in q && q.sortDir) params.set("sortDir", q.sortDir);
  if ("page" in q && q.page) params.set("page", String(q.page));
  if ("limit" in q && q.limit) params.set("limit", String(q.limit));
  const str = params.toString();
  return str ? `?${str}` : "";
}

export const properties = {
  async getProperties() {
    const rows = await request<BackendProperty[]>("/properties");
    return rows.map((property) => mapBackendProperty(property));
  },

  /** Raw backend rows for admin tables (same endpoint as getProperties). */
  async getRawProperties() {
    return request<BackendProperty[]>("/properties");
  },

  /** Admin: paginated property list with server-side filters and sort. */
  async adminListProperties(query: AdminListPropertiesQuery = {}) {
    return request<AdminListPropertiesResponse>(
      `/properties/admin${buildAdminPropertiesQuery(query)}`,
      { token: getStoredToken() },
    );
  },

  /** Admin: status tab counts for the same filters (excluding status). */
  async adminPropertyStats(query: AdminPropertyStatsQuery = {}) {
    return request<AdminPropertyStats>(
      `/properties/admin/stats${buildAdminPropertiesQuery(query)}`,
      { token: getStoredToken() },
    );
  },

  async getMyProperties() {
    const rows = await request<BackendProperty[]>("/properties/my-properties", {
      method: "GET",
      token: getStoredToken(),
    });
    return rows.map((property) => mapBackendProperty(property));
  },

  async getProperty(id: string) {
    const property = await request<BackendProperty>(`/properties/${id}`);
    return mapBackendProperty(property);
  },

  async getRawProperty(id: string) {
    return request<BackendProperty>(`/properties/${id}`);
  },

  async createProperty(input: Record<string, unknown>) {
    const created = await request<BackendProperty>("/properties", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
    return mapBackendProperty(created);
  },

  async updateProperty(id: string, input: Record<string, unknown>) {
    const updated = await request<BackendProperty>(`/properties/${id}`, {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
    return mapBackendProperty(updated);
  },

  async deleteProperty(id: string) {
    return request<{ message: string }>(`/properties/${id}`, {
      method: "DELETE",
      token: getStoredToken(),
    });
  },

  /**
   * Admin: approve a pending listing.
   * Backend: `POST /properties/:id/approve` — with agent `{ agentId: number }`, or skip assignment `{ skipAgentAssignment: true }`.
   */
  async approveProperty(
    id: string,
    options: { assignedAgentId: number } | { skipAgentAssignment: true },
  ) {
    const body =
      "skipAgentAssignment" in options && options.skipAgentAssignment
        ? JSON.stringify({ skipAgentAssignment: true })
        : JSON.stringify({ assignedAgentId: (options as { assignedAgentId: number }).assignedAgentId });
    const updated = await request<BackendProperty>(`/properties/${id}/approve`, {
      method: "PATCH",
      token: getStoredToken(),
      body,
    });
    return mapBackendProperty(updated);
  },

  /**
   * Admin: reject a pending listing with a reason.
   * Backend: `POST /properties/:id/reject` body `{ reason: string }`.
   */
  async rejectProperty(id: string, reason: string) {
    const raw = await request<BackendProperty | undefined>(`/properties/${id}/reject`, {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify({ reason }),
    });
    return raw ? mapBackendProperty(raw) : undefined;
  },
};
