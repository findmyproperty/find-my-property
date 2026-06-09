import type {
  CreateSupportTicketInput,
  SupportTicket,
  SupportTicketStatus,
} from "@/schema/support-ticket";
import { getStoredToken, request } from "@/end-points/http";

export interface AdminListSupportTicketsQuery {
  status?: SupportTicketStatus;
  page?: number;
  limit?: number;
}

export interface AdminListSupportTicketsResponse {
  items: SupportTicket[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminPatchSupportTicketInput {
  status?: SupportTicketStatus;
  adminNotes?: string | null;
}

export const supportTickets = {
  async createMine(input: CreateSupportTicketInput): Promise<SupportTicket> {
    return request<SupportTicket>("/support-tickets", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },

  async listMine(): Promise<SupportTicket[]> {
    return request<SupportTicket[]>("/support-tickets/mine", {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async listAdmin(
    query: AdminListSupportTicketsQuery = {},
  ): Promise<AdminListSupportTicketsResponse> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<AdminListSupportTicketsResponse>(
      `/admin/support-tickets${qs ? `?${qs}` : ""}`,
      { method: "GET", token: getStoredToken() },
    );
  },

  async adminPatch(
    id: number,
    input: AdminPatchSupportTicketInput,
  ): Promise<SupportTicket> {
    return request<SupportTicket>(`/admin/support-tickets/${id}`, {
      method: "PATCH",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },
};
