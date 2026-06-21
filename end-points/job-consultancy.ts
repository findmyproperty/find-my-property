import { getStoredToken, request } from "@/end-points/http";

export type JobConsultancyType = "it" | "non_it" | "customer_support";

export type JobConsultancyStatus =
  | "new"
  | "contacted"
  | "screening"
  | "interview_scheduled"
  | "placed"
  | "rejected"
  | "cancelled";

export interface JobConsultancyDetails {
  notes?: string | null;
}

export interface JobConsultancyDTO {
  id: number;
  consultancyType: JobConsultancyType;
  status: JobConsultancyStatus;
  userId: number | null;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  details: JobConsultancyDetails;
  internalNotes: string | null;
  assignedAdminId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobConsultancyInput {
  consultancyType: JobConsultancyType;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  details: JobConsultancyDetails;
}

export interface AdminListJobConsultancyQuery {
  consultancyType?: JobConsultancyType;
  status?: JobConsultancyStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface AdminUpdateJobConsultancyInput {
  status?: JobConsultancyStatus;
  internalNotes?: string;
  assignedAdminId?: number | null;
}

export interface JobConsultancyStats {
  byType: Record<JobConsultancyType, Record<JobConsultancyStatus, number>>;
  totals: Record<JobConsultancyType, number>;
  openTotal: number;
}

function buildQuery(query: AdminListJobConsultancyQuery): string {
  const params = new URLSearchParams();
  if (query.consultancyType) params.set("consultancyType", query.consultancyType);
  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const jobConsultancy = {
  async submitJobConsultancy(
    input: JobConsultancyInput,
  ): Promise<JobConsultancyDTO> {
    return request<JobConsultancyDTO>("/job-consultancy", {
      method: "POST",
      body: JSON.stringify(input),
      token: getStoredToken(),
    });
  },

  async getMyJobConsultancyRequests(): Promise<JobConsultancyDTO[]> {
    const rows = await request<JobConsultancyDTO[]>("/job-consultancy/mine", {
      method: "GET",
      token: getStoredToken(),
    });
    return Array.isArray(rows) ? rows : [];
  },

  async adminListJobConsultancy(query: AdminListJobConsultancyQuery = {}) {
    return request<{
      items: JobConsultancyDTO[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/job-consultancy${buildQuery(query)}`, {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async adminUpdateJobConsultancy(
    id: number,
    input: AdminUpdateJobConsultancyInput,
  ): Promise<JobConsultancyDTO> {
    return request<JobConsultancyDTO>(`/admin/job-consultancy/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      token: getStoredToken(),
    });
  },

  async adminJobConsultancyStats(): Promise<JobConsultancyStats> {
    return request<JobConsultancyStats>("/admin/job-consultancy/stats", {
      method: "GET",
      token: getStoredToken(),
    });
  },
};