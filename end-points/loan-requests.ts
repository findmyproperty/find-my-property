import { getStoredToken, request } from "@/end-points/http";

export type LoanType =
  | "home_loan"
  | "personal_loan"
  | "vehicle_loan"
  | "mortgage";

export type LoanRequestStatus =
  | "new"
  | "contacted"
  | "documents_pending"
  | "under_review"
  | "approved"
  | "disbursed"
  | "rejected"
  | "cancelled";

export interface LoanRequestDetails {
  notes?: string | null;
}

export interface LoanRequestDTO {
  id: number;
  loanType: LoanType;
  status: LoanRequestStatus;
  userId: number | null;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  details: LoanRequestDetails;
  internalNotes: string | null;
  assignedAdminId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanRequestInput {
  loanType: LoanType;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  details: LoanRequestDetails;
}

export interface AdminListLoanRequestsQuery {
  loanType?: LoanType;
  status?: LoanRequestStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface AdminUpdateLoanRequestInput {
  status?: LoanRequestStatus;
  internalNotes?: string;
  assignedAdminId?: number | null;
}

export interface LoanRequestStats {
  byType: Record<LoanType, Record<LoanRequestStatus, number>>;
  totals: Record<LoanType, number>;
  openTotal: number;
}

function buildQuery(query: AdminListLoanRequestsQuery): string {
  const params = new URLSearchParams();
  if (query.loanType) params.set("loanType", query.loanType);
  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const loanRequests = {
  async submitLoanRequest(input: LoanRequestInput): Promise<LoanRequestDTO> {
    return request<LoanRequestDTO>("/loan-requests", {
      method: "POST",
      body: JSON.stringify(input),
      token: getStoredToken(),
    });
  },

  async getMyLoanRequests(): Promise<LoanRequestDTO[]> {
    const rows = await request<LoanRequestDTO[]>("/loan-requests/mine", {
      method: "GET",
      token: getStoredToken(),
    });
    return Array.isArray(rows) ? rows : [];
  },

  async adminListLoanRequests(query: AdminListLoanRequestsQuery = {}) {
    return request<{
      items: LoanRequestDTO[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/loan-requests${buildQuery(query)}`, {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async adminGetLoanRequest(id: number): Promise<LoanRequestDTO> {
    return request<LoanRequestDTO>(`/admin/loan-requests/${id}`, {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async adminUpdateLoanRequest(
    id: number,
    input: AdminUpdateLoanRequestInput,
  ): Promise<LoanRequestDTO> {
    return request<LoanRequestDTO>(`/admin/loan-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      token: getStoredToken(),
    });
  },

  async adminLoanRequestStats(): Promise<LoanRequestStats> {
    return request<LoanRequestStats>("/admin/loan-requests/stats", {
      method: "GET",
      token: getStoredToken(),
    });
  },
};