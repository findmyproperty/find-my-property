"use client";

import { FormEvent, useMemo, useState } from "react";
import { format } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import {
  CreditCard,
  IndianRupee,
  Loader2,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminListPage } from "@/components/admin/admin-list-page";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import type { LedgerEntry, PayoutAccount, Withdrawal } from "@/end-points/vendor-wallet";
import {
  compareDates,
  compareStrings,
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls";
import {
  useCreateVendorWithdrawal,
  useCreateVendorPayoutAccount,
  useVendorPayoutAccounts,
  useVendorWalletEntries,
  useVendorWalletSummary,
  useVendorWithdrawals,
} from "@/hooks/use-vendor-wallet";
import { useToast } from "@/hooks/use-toast";
import { PAYOUT_STATUS_OPTIONS } from "@/lib/admin/status-config";

const PAGE_SIZE = 20;

type AccountType = "vpa" | "bank_account";
type PayoutMode = "UPI" | "IMPS" | "NEFT" | "RTGS";
type PayoutStatusFilter = "all" | string;
type WithdrawalSortKey = "date" | "reference" | "mode" | "status" | "amount";
type LedgerSortKey = "date" | "type" | "amount" | "status" | "description";

function formatCurrency(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function accountTitle(account: PayoutAccount) {
  if (account.type === "vpa") {
    return account.vpaAddress ?? "UPI account";
  }

  const bank = account.bankName ? `${account.bankName} ` : "";
  return `${bank}account ending ${account.accountNumberLast4 ?? "----"}`;
}

function accountBadge(account: PayoutAccount) {
  return account.type === "vpa" ? (
    <Badge variant="secondary">UPI</Badge>
  ) : (
    <Badge variant="outline">Bank</Badge>
  );
}

function defaultModeForAccount(account: PayoutAccount | undefined): PayoutMode {
  return account?.type === "vpa" ? "UPI" : "IMPS";
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "processed" || normalized === "settled") {
    return <Badge className="bg-emerald-600 text-white">Settled</Badge>;
  }
  if (["failed", "reversed", "cancelled", "rejected"].includes(normalized)) {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function normalizeStatus(status: string) {
  return status.toLowerCase();
}

function payoutStatusCounts<T extends { status: string }>(items: readonly T[]) {
  return PAYOUT_STATUS_OPTIONS.reduce(
    (counts, option) => {
      counts[option.value] = items.filter(
        (item) => normalizeStatus(item.status) === option.value,
      ).length;
      return counts;
    },
    {} as Record<string, number>,
  );
}

function filterByStatus<T extends { status: string }>(
  items: readonly T[],
  statusFilter: PayoutStatusFilter,
) {
  if (statusFilter === "all") return items;
  return items.filter((item) => normalizeStatus(item.status) === statusFilter);
}

const withdrawalColumns: ColumnDef<Withdrawal, unknown>[] = [
  {
    id: "date",
    header: "Date",
    meta: { sortKey: "date", className: "text-xs" },
    cell: ({ row }) => format(new Date(row.original.createdAt), "PP"),
  },
  {
    id: "reference",
    header: "Reference",
    meta: { sortKey: "reference", className: "text-xs text-muted-foreground" },
    cell: ({ row }) => row.original.referenceId,
  },
  {
    id: "mode",
    header: "Mode",
    meta: { sortKey: "mode" },
    cell: ({ row }) => row.original.mode,
  },
  {
    id: "status",
    header: "Status",
    meta: { sortKey: "status" },
    cell: ({ row }) => statusBadge(row.original.status),
  },
  {
    id: "amount",
    header: "Amount",
    meta: { sortKey: "amount", className: "text-right font-medium" },
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
];

const ledgerColumns: ColumnDef<LedgerEntry, unknown>[] = [
  {
    id: "date",
    header: "Date",
    meta: { sortKey: "date", className: "text-xs" },
    cell: ({ row }) => format(new Date(row.original.createdAt), "PP"),
  },
  {
    id: "type",
    header: "Type",
    meta: { sortKey: "type", className: "capitalize" },
    cell: ({ row }) => row.original.type,
  },
  {
    id: "amount",
    header: "Amount",
    meta: { sortKey: "amount" },
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  {
    id: "status",
    header: "Status",
    meta: { sortKey: "status" },
    cell: ({ row }) => statusBadge(row.original.status),
  },
  {
    id: "description",
    header: "Description",
    meta: {
      sortKey: "description",
      className: "max-w-[220px] truncate text-xs text-muted-foreground",
    },
    cell: ({ row }) => row.original.description,
  },
];

function compareWithdrawals(a: Withdrawal, b: Withdrawal, key: WithdrawalSortKey): number {
  switch (key) {
    case "date":
      return compareDates(a.createdAt, b.createdAt);
    case "reference":
      return compareStrings(a.referenceId, b.referenceId);
    case "mode":
      return compareStrings(a.mode, b.mode);
    case "status":
      return compareStrings(a.status, b.status);
    case "amount":
      return a.amount - b.amount;
  }
}

function compareLedgerEntries(a: LedgerEntry, b: LedgerEntry, key: LedgerSortKey): number {
  switch (key) {
    case "date":
      return compareDates(a.createdAt, b.createdAt);
    case "type":
      return compareStrings(a.type, b.type);
    case "amount":
      return a.amount - b.amount;
    case "status":
      return compareStrings(a.status, b.status);
    case "description":
      return compareStrings(a.description ?? "", b.description ?? "");
  }
}

function withdrawalSearchText(withdrawal: Withdrawal): string {
  return [
    withdrawal.referenceId,
    withdrawal.mode,
    withdrawal.status,
    String(withdrawal.amount),
    String(withdrawal.id),
  ]
    .join(" ")
    .toLowerCase();
}

function ledgerSearchText(entry: LedgerEntry): string {
  return [
    entry.type,
    entry.status,
    entry.description,
    String(entry.amount),
    String(entry.id),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function WithdrawalsSection({
  items,
  isLoading,
}: {
  items: Withdrawal[];
  isLoading: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<PayoutStatusFilter>("all");

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
  } = useAdminListControls<WithdrawalSortKey>({
    defaultSort: { key: "date", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [statusFilter],
  });

  const statusCounts = useMemo(() => payoutStatusCounts(items), [items]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const filtered = filterByStatus(items, statusFilter).filter((withdrawal) => {
      if (q && !withdrawalSearchText(withdrawal).includes(q)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const result = compareWithdrawals(a, b, sort.key);
      return sort.dir === "asc" ? result : -result;
    });
  }, [debouncedSearch, items, sort.dir, sort.key, statusFilter]);

  const pagedItems = useMemo(
    () => paginateItems(filteredItems, page, PAGE_SIZE),
    [filteredItems, page],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card p-4">
      <AdminListPage
        title="Withdrawals"
        description="Track payout requests sent to your saved accounts."
        isLoading={isLoading}
        loadingLabel="Loading withdrawals…"
        isEmpty={!isLoading && filteredItems.length === 0}
        emptyTitle={items.length === 0 ? "No withdrawals yet" : "No withdrawals match your filters"}
        emptyDescription={
          items.length === 0
            ? "Withdrawal requests will appear here after you request a payout."
            : "Try All statuses or clearing search."
        }
        toolbar={
          <AdminToolbar
            statusFilter={{
              value: statusFilter,
              onChange: setStatusFilter,
              options: PAYOUT_STATUS_OPTIONS,
              counts: statusCounts,
              totalCount: items.length,
            }}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search reference, mode, or status…",
            }}
          />
        }
        pagination={{
          page: pagedItems.page,
          totalPages: pagedItems.totalPages,
          total: pagedItems.total,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
        }}
      >
          <AdminDataTable
            className="rounded-lg border"
            columns={withdrawalColumns}
            data={pagedItems.items}
            getRowId={(row) => String(row.id)}
            sort={sort}
            onSort={toggleSort}
          />
      </AdminListPage>
    </div>
  );
}

function LedgerSection({
  items,
  isLoading,
}: {
  items: LedgerEntry[];
  isLoading: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<PayoutStatusFilter>("all");

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
  } = useAdminListControls<LedgerSortKey>({
    defaultSort: { key: "date", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [statusFilter],
  });

  const statusCounts = useMemo(() => payoutStatusCounts(items), [items]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const filtered = filterByStatus(items, statusFilter).filter((entry) => {
      if (q && !ledgerSearchText(entry).includes(q)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const result = compareLedgerEntries(a, b, sort.key);
      return sort.dir === "asc" ? result : -result;
    });
  }, [debouncedSearch, items, sort.dir, sort.key, statusFilter]);

  const pagedItems = useMemo(
    () => paginateItems(filteredItems, page, PAGE_SIZE),
    [filteredItems, page],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card p-4">
      <AdminListPage
        title="Ledger"
        description="Credits, debits, and settlement activity in your wallet."
        isLoading={isLoading}
        loadingLabel="Loading ledger…"
        isEmpty={!isLoading && filteredItems.length === 0}
        emptyTitle={items.length === 0 ? "No ledger entries yet" : "No entries match your filters"}
        emptyDescription={
          items.length === 0
            ? "Wallet activity will show up here as jobs settle."
            : "Try All statuses or clearing search."
        }
        toolbar={
          <AdminToolbar
            statusFilter={{
              value: statusFilter,
              onChange: setStatusFilter,
              options: PAYOUT_STATUS_OPTIONS,
              counts: statusCounts,
              totalCount: items.length,
            }}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search type, description, or status…",
            }}
          />
        }
        pagination={{
          page: pagedItems.page,
          totalPages: pagedItems.totalPages,
          total: pagedItems.total,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
        }}
      >
          <AdminDataTable
            className="rounded-lg border"
            columns={ledgerColumns}
            data={pagedItems.items}
            getRowId={(row) => String(row.id)}
            sort={sort}
            onSort={toggleSort}
          />
      </AdminListPage>
    </div>
  );
}

export default function VendorWallet() {
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<AccountType>("vpa");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [label, setLabel] = useState("");
  const [vpaAddress, setVpaAddress] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccountId, setWithdrawAccountId] = useState("");
  const [withdrawMode, setWithdrawMode] = useState<PayoutMode>("IMPS");

  const { data: summary, isLoading: summaryLoading } = useVendorWalletSummary();
  const { data: entries, isLoading: entriesLoading } = useVendorWalletEntries(1);
  const { data: payoutAccounts, isLoading: accountsLoading } = useVendorPayoutAccounts();
  const { data: withdrawals, isLoading: withdrawalsLoading } = useVendorWithdrawals(1);
  const createAccount = useCreateVendorPayoutAccount();
  const createWithdrawal = useCreateVendorWithdrawal();

  const accounts = payoutAccounts ?? [];
  const activeAccounts = accounts.filter((account) => account.active);
  const availableBalance = summary?.availableBalance ?? summary?.pendingSettlement ?? 0;
  const selectedWithdrawAccount = activeAccounts.find(
    (account) => String(account.id) === withdrawAccountId,
  );
  const withdrawModes: PayoutMode[] =
    selectedWithdrawAccount?.type === "vpa" ? ["UPI"] : ["IMPS", "NEFT", "RTGS"];
  const cards = [
    { label: "Available", value: availableBalance },
    { label: "Pending payouts", value: summary?.pendingPayouts ?? 0 },
    { label: "Paid out", value: summary?.paidOut ?? 0 },
    { label: "Commission", value: summary?.commissionDeducted ?? 0 },
  ];

  const resetForm = () => {
    setBeneficiaryName("");
    setLabel("");
    setVpaAddress("");
    setIfsc("");
    setAccountNumber("");
  };

  const openWithdrawDialog = () => {
    const firstAccount = activeAccounts[0];
    setWithdrawAccountId(firstAccount ? String(firstAccount.id) : "");
    setWithdrawMode(defaultModeForAccount(firstAccount));
    setWithdrawAmount(availableBalance > 0 ? String(availableBalance) : "");
    setIsWithdrawOpen(true);
  };

  const closeWithdrawDialog = () => {
    if (createWithdrawal.isPending) return;
    setIsWithdrawOpen(false);
    setWithdrawAmount("");
    setWithdrawAccountId("");
    setWithdrawMode("IMPS");
  };

  const selectWithdrawAccount = (accountId: string) => {
    const nextAccount = activeAccounts.find((account) => String(account.id) === accountId);
    setWithdrawAccountId(accountId);
    setWithdrawMode(defaultModeForAccount(nextAccount));
  };

  const submitWithdrawal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWithdrawAccount) {
      toast({
        title: "Add payout account",
        description: "Save a UPI or bank account before withdrawing.",
        variant: "destructive",
      });
      return;
    }

    const parsedAmount = Number(withdrawAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      toast({
        title: "Enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (parsedAmount > availableBalance) {
      toast({
        title: "Amount exceeds wallet balance",
        description: `You can withdraw up to ${formatCurrency(availableBalance)}.`,
        variant: "destructive",
      });
      return;
    }

    createWithdrawal.mutate(
      {
        payoutAccountId: selectedWithdrawAccount.id,
        amount: parsedAmount,
        mode: withdrawMode,
        description: "Vendor wallet withdrawal",
      },
      {
        onSuccess: (withdrawal) => {
          toast({
            title: "Withdrawal requested",
            description: `Status: ${withdrawal.status}. Reference: ${withdrawal.referenceId}`,
          });
          closeWithdrawDialog();
        },
        onError: (error) =>
          toast({
            title: "Withdrawal failed",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  const submitAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (beneficiaryName.trim().length < 3) {
      toast({
        title: "Enter beneficiary name",
        description: "Use the same name linked to your bank account or UPI ID.",
        variant: "destructive",
      });
      return;
    }

    if (accountType === "vpa" && !vpaAddress.trim()) {
      toast({
        title: "Enter UPI ID",
        variant: "destructive",
      });
      return;
    }

    if (accountType === "bank_account" && (!ifsc.trim() || !accountNumber.trim())) {
      toast({
        title: "Enter bank details",
        description: "IFSC and account number are required for bank payouts.",
        variant: "destructive",
      });
      return;
    }

    createAccount.mutate(
      accountType === "vpa"
        ? {
            type: "vpa",
            beneficiaryName: beneficiaryName.trim(),
            label: label.trim() || undefined,
            vpaAddress: vpaAddress.trim(),
          }
        : {
            type: "bank_account",
            beneficiaryName: beneficiaryName.trim(),
            label: label.trim() || undefined,
            ifsc: ifsc.trim().toUpperCase(),
            accountNumber: accountNumber.trim(),
          },
      {
        onSuccess: () => {
          toast({ title: "Payout account saved" });
          resetForm();
        },
        onError: (error) =>
          toast({
            title: "Unable to save payout account",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <AdminListPage
      title="Wallet"
      description="Track earnings and manage the payout account admin will use for settlements."
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            RazorpayX payouts
          </Badge>
          <Button
            onClick={openWithdrawDialog}
            disabled={availableBalance <= 0 || activeAccounts.length === 0}
            title={
              activeAccounts.length === 0
                ? "Add payout account before withdrawing"
                : "Withdraw available balance"
            }
          >
            <IndianRupee className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>
      }
      isLoading={summaryLoading}
      loadingLabel="Loading wallet…"
      footer={
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(card.value)}</p>
              </div>
            ))}
          </div>

          <Dialog
            open={isWithdrawOpen}
            onOpenChange={(open) => {
              if (!open) closeWithdrawDialog();
              if (open) openWithdrawDialog();
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Withdraw from wallet</DialogTitle>
                <DialogDescription>
                  Send your available wallet balance to a saved UPI or bank account.
                </DialogDescription>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={submitWithdrawal}>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Available balance</p>
                  <p className="mt-1 text-lg font-semibold">{formatCurrency(availableBalance)}</p>
                </div>

                <div className="grid gap-2">
                  <Label>Payout account</Label>
                  <Select value={withdrawAccountId} onValueChange={selectWithdrawAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose payout account" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAccounts.map((account) => (
                        <SelectItem key={account.id} value={String(account.id)}>
                          {accountTitle(account)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="withdraw-amount">Amount (INR)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      min={1}
                      max={availableBalance || undefined}
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(event) => setWithdrawAmount(event.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Mode</Label>
                    <Select
                      value={withdrawMode}
                      onValueChange={(value) => setWithdrawMode(value as PayoutMode)}
                      disabled={selectedWithdrawAccount?.type === "vpa"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {withdrawModes.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Withdrawal request</AlertTitle>
                  <AlertDescription>
                    The amount moves to pending withdrawals while RazorpayX processes it.
                  </AlertDescription>
                </Alert>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeWithdrawDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createWithdrawal.isPending || !withdrawAmount.trim()}
                  >
                    {createWithdrawal.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      "Request withdrawal"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border p-4">
                <h3 className="font-semibold">Payout accounts</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save UPI or bank details before admin can release a payout.
                </p>
              </div>
              <div className="divide-y divide-border">
                {accountsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : accounts.length > 0 ? (
                  accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{accountTitle(account)}</p>
                          {accountBadge(account)}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {account.beneficiaryName}
                          {account.label ? ` - ${account.label}` : ""}
                        </p>
                      </div>
                      <Badge variant={account.active ? "secondary" : "destructive"}>
                        {account.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No payout account saved yet.
                  </div>
                )}
              </div>
            </div>

            <form className="rounded-lg border border-border bg-card p-4" onSubmit={submitAccount}>
              <div className="mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Add payout account</h3>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Account type</Label>
                  <Select
                    value={accountType}
                    onValueChange={(value) => setAccountType(value as AccountType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vpa">UPI ID / VPA</SelectItem>
                      <SelectItem value="bank_account">Bank account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="beneficiary-name">Beneficiary name</Label>
                  <Input
                    id="beneficiary-name"
                    value={beneficiaryName}
                    onChange={(event) => setBeneficiaryName(event.target.value)}
                    placeholder="Name as per bank or UPI"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="account-label">Label</Label>
                  <Input
                    id="account-label"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="Primary account"
                  />
                </div>

                {accountType === "vpa" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="vpa-address">UPI ID</Label>
                    <Input
                      id="vpa-address"
                      value={vpaAddress}
                      onChange={(event) => setVpaAddress(event.target.value)}
                      placeholder="name@bank"
                    />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="ifsc">IFSC</Label>
                      <Input
                        id="ifsc"
                        value={ifsc}
                        onChange={(event) => setIfsc(event.target.value)}
                        placeholder="HDFC0000001"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="account-number">Account number</Label>
                      <Input
                        id="account-number"
                        value={accountNumber}
                        onChange={(event) => setAccountNumber(event.target.value)}
                        placeholder="Enter account number"
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={createAccount.isPending}>
                  {createAccount.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Save payout account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>

          <Tabs defaultValue="withdrawals" className="space-y-4">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-border bg-card p-1">
              <TabsTrigger value="withdrawals" className="gap-2">
                Withdrawals
              </TabsTrigger>
              <TabsTrigger value="ledger" className="gap-2">
                Ledger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="withdrawals" className="mt-0">
              <WithdrawalsSection
                items={withdrawals?.items ?? []}
                isLoading={withdrawalsLoading}
              />
            </TabsContent>

            <TabsContent value="ledger" className="mt-0">
              <LedgerSection items={entries?.items ?? []} isLoading={entriesLoading} />
            </TabsContent>
          </Tabs>
        </>
      }
    />
  );
}
