import { getStoredToken, request } from "@/end-points/http";
import type { EmailLog, EmailLogStatus } from "@/schema/email-log";

export interface AdminListEmailLogsQuery {
  feature?: string;
  status?: EmailLogStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface AdminListEmailLogsResponse {
  items: EmailLog[];
  total: number;
  page: number;
  limit: number;
}

function buildQuery(query: AdminListEmailLogsQuery = {}) {
  const params = new URLSearchParams();
  if (query.feature) params.set("feature", query.feature);
  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const emailLogs = {
  async adminList(
    query: AdminListEmailLogsQuery = {},
  ): Promise<AdminListEmailLogsResponse> {
    return request<AdminListEmailLogsResponse>(
      `/admin/email-logs${buildQuery(query)}`,
      { method: "GET", token: getStoredToken() },
    );
  },

  async adminResend(id: number): Promise<EmailLog> {
    return request<EmailLog>(`/admin/email-logs/${id}/resend`, {
      method: "POST",
      token: getStoredToken(),
    });
  },
};