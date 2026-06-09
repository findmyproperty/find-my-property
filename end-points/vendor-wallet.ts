import { getStoredToken, request } from "@/end-points/http";

export interface WalletSummary {
  totalEarnings: number;
  pendingSettlement: number;
  paidOut: number;
  commissionDeducted: number;
}

export interface LedgerEntry {
  id: number;
  vendorUserId: number;
  vendorLeadId: number | null;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: string;
}

export interface LedgerListResponse {
  items: LedgerEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminPayoutInput {
  vendorUserId: number;
  amount: number;
  description?: string;
}

export const vendorWallet = {
  async getSummary(): Promise<WalletSummary> {
    return request<WalletSummary>("/vendor-wallet/summary", {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async listEntries(page = 1, limit = 30): Promise<LedgerListResponse> {
    return request<LedgerListResponse>(
      `/vendor-wallet/entries?page=${page}&limit=${limit}`,
      { method: "GET", token: getStoredToken() },
    );
  },

  async adminSummary(vendorUserId: number): Promise<WalletSummary> {
    return request<WalletSummary>(`/admin/vendor-wallet/${vendorUserId}/summary`, {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async adminEntries(
    vendorUserId: number,
    page = 1,
    limit = 30,
  ): Promise<LedgerListResponse> {
    return request<LedgerListResponse>(
      `/admin/vendor-wallet/${vendorUserId}/entries?page=${page}&limit=${limit}`,
      { method: "GET", token: getStoredToken() },
    );
  },

  async adminPayout(input: AdminPayoutInput): Promise<LedgerEntry> {
    return request<LedgerEntry>("/admin/vendor-wallet/payout", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },
};
