"use client";

import { FormEvent, useState } from "react";
import { format } from "date-fns";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateVendorWithdrawal,
  useCreateVendorPayoutAccount,
  useVendorPayoutAccounts,
  useVendorWalletEntries,
  useVendorWalletSummary,
  useVendorWithdrawals,
} from "@/hooks/use-vendor-wallet";
import { useToast } from "@/hooks/use-toast";
import type { PayoutAccount } from "@/end-points/vendor-wallet";

type AccountType = "vpa" | "bank_account";
type PayoutMode = "UPI" | "IMPS" | "NEFT" | "RTGS";

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

  if (summaryLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading flex items-center gap-2 text-xl font-bold">
            <Wallet className="h-5 w-5" />
            Wallet
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track earnings and manage the payout account admin will use for settlements.
          </p>
        </div>
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
      </div>

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
                <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
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
              <Select value={accountType} onValueChange={(value) => setAccountType(value as AccountType)}>
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

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <h3 className="border-b border-border p-4 font-semibold">Withdrawals</h3>
        {withdrawalsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals?.items.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell className="text-xs">
                    {format(new Date(withdrawal.createdAt), "PP")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {withdrawal.referenceId}
                  </TableCell>
                  <TableCell>{withdrawal.mode}</TableCell>
                  <TableCell>{statusBadge(withdrawal.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(withdrawal.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {withdrawals?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No withdrawals yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <h3 className="border-b border-border p-4 font-semibold">Ledger</h3>
        {entriesLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries?.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">
                    {format(new Date(entry.createdAt), "PP")}
                  </TableCell>
                  <TableCell className="capitalize">{entry.type}</TableCell>
                  <TableCell>{formatCurrency(entry.amount)}</TableCell>
                  <TableCell>{statusBadge(entry.status)}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                    {entry.description}
                  </TableCell>
                </TableRow>
              ))}
              {entries?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No ledger entries yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
