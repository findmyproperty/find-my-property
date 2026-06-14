import { getStoredToken, request } from "@/end-points/http";

export interface WalletSummary {
  totalEarnings: number;
  pendingSettlement: number;
  availableBalance?: number;
  pendingPayouts?: number;
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

export interface PayoutAccount {
  id: number;
  vendorUserId: number;
  type: "bank_account" | "vpa" | string;
  label: string | null;
  beneficiaryName: string;
  ifsc: string | null;
  bankName: string | null;
  accountNumberLast4: string | null;
  vpaAddress: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  id: number;
  vendorUserId: number;
  payoutAccountId: number;
  ledgerEntryId: number | null;
  amount: number;
  amountPaise: number;
  currency: string;
  status: string;
  mode: string;
  purpose: string;
  referenceId: string;
  razorpayPayoutId: string | null;
  utr: string | null;
  failureReason: string | null;
  statusDetails: Record<string, unknown> | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalListResponse {
  items: Withdrawal[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePayoutAccountInput {
  type: "bank_account" | "vpa";
  beneficiaryName: string;
  label?: string;
  ifsc?: string;
  accountNumber?: string;
  vpaAddress?: string;
}

export interface CreateWithdrawalInput {
  payoutAccountId: number;
  amount: number;
  mode?: "UPI" | "IMPS" | "NEFT" | "RTGS";
  description?: string;
}

export interface AdminPayoutInput {
  vendorUserId: number;
  amount: number;
  description?: string;
}

export interface AdminCreatePayoutInput extends CreateWithdrawalInput {
  vendorUserId: number;
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

  async listPayoutAccounts(): Promise<PayoutAccount[]> {
    const rows = await request<PayoutAccount[]>("/vendor-wallet/payout-accounts", {
      method: "GET",
      token: getStoredToken(),
    });
    return Array.isArray(rows) ? rows : [];
  },

  async createPayoutAccount(input: CreatePayoutAccountInput): Promise<PayoutAccount> {
    return request<PayoutAccount>("/vendor-wallet/payout-accounts", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },

  async createWithdrawal(input: CreateWithdrawalInput): Promise<Withdrawal> {
    return request<Withdrawal>("/vendor-wallet/withdrawals", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },

  async listWithdrawals(page = 1, limit = 30): Promise<WithdrawalListResponse> {
    return request<WithdrawalListResponse>(
      `/vendor-wallet/withdrawals?page=${page}&limit=${limit}`,
      { method: "GET", token: getStoredToken() },
    );
  },

  async adminPayoutAccounts(vendorUserId: number): Promise<PayoutAccount[]> {
    const rows = await request<PayoutAccount[]>(
      `/admin/vendor-wallet/${vendorUserId}/payout-accounts`,
      { method: "GET", token: getStoredToken() },
    );
    return Array.isArray(rows) ? rows : [];
  },

  async adminPayout(input: AdminPayoutInput): Promise<LedgerEntry> {
    return request<LedgerEntry>("/admin/vendor-wallet/payout", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },

  async adminCreatePayout(input: AdminCreatePayoutInput): Promise<Withdrawal> {
    return request<Withdrawal>("/admin/vendor-wallet/payouts", {
      method: "POST",
      token: getStoredToken(),
      body: JSON.stringify(input),
    });
  },
};
