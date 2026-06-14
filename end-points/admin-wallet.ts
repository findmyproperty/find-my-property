import { getStoredToken, request } from "@/end-points/http";

export type AdminTopUpMethod = "upi" | "card" | "netbanking";

export interface AdminWalletSummary {
  balance: number;
  totalTopUps: number;
  pendingTopUps: number;
  payoutDebits: number;
  pendingPayoutDebits: number;
}

export interface AdminWalletEntry {
  id: number;
  adminUserId: number | null;
  vendorUserId: number | null;
  vendorWithdrawalId: number | null;
  type: string;
  amount: number;
  amountPaise: number;
  currency: string;
  status: string;
  referenceId: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpayPayoutId: string | null;
  paymentMethod: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWalletEntryListResponse {
  items: AdminWalletEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAdminTopUpInput {
  amount: number;
  method?: AdminTopUpMethod;
  description?: string;
}

export interface CreateAdminTopUpResponse {
  keyId: string;
  walletEntry: AdminWalletEntry;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  };
}

export interface VerifyAdminTopUpInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const adminWallet = {
  async getSummary(): Promise<AdminWalletSummary> {
    return request<AdminWalletSummary>("/admin/e-wallet/summary", {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async listEntries(page = 1, limit = 30): Promise<AdminWalletEntryListResponse> {
    return request<AdminWalletEntryListResponse>(
      `/admin/e-wallet/entries?page=${page}&limit=${limit}`,
      { method: "GET", token: getStoredToken() },
    );
  },

  async createTopUp(input: CreateAdminTopUpInput): Promise<CreateAdminTopUpResponse> {
    return request<CreateAdminTopUpResponse>("/admin/e-wallet/top-ups", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },

  async verifyTopUp(input: VerifyAdminTopUpInput): Promise<AdminWalletEntry> {
    return request<AdminWalletEntry>("/admin/e-wallet/top-ups/verify", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },
};
