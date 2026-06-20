"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  CheckCircle2,
  IndianRupee,
  Loader2,
  ShieldCheck,
  WalletCards,
  XCircle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PayoutAccount, WalletSummary } from "@/end-points/vendor-wallet";
import { useAdminVendors } from "@/hooks/use-vendor-leads";
import {
  useAdminCreditVendorWallet,
  useAdminVendorPayoutAccounts,
  useAdminVendorWalletSummary,
} from "@/hooks/use-vendor-wallet";
import { useToast } from "@/hooks/use-toast";
import type { VendorProfile } from "@/schema/vendor";

function displayName(vendor: VendorProfile) {
  return vendor.businessName || vendor.user?.name || `Vendor #${vendor.userId}`;
}

function formatCategory(category: string) {
  return category.replace(/_/g, " ");
}

function formatCurrency(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function accountLabel(account: PayoutAccount) {
  if (account.type === "vpa") {
    return account.vpaAddress ?? "UPI account";
  }

  const bankName = account.bankName ? `${account.bankName} ` : "";
  return `${bankName}ending ${account.accountNumberLast4 ?? "----"}`;
}

function verificationBadge(status: VendorProfile["verificationStatus"]) {
  if (status === "verified") {
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Verified
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <Badge variant="outline" className="border-destructive/30 bg-destructive/5 text-destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Rejected
      </Badge>
    );
  }

  return <Badge variant="secondary">Pending verification</Badge>;
}

function userStatusBadge(isActive: boolean | undefined) {
  if (isActive === false) return <Badge variant="destructive">Inactive</Badge>;
  return <Badge variant="secondary">Active</Badge>;
}

function VendorWalletRow({
  vendor,
  onCredit,
}: {
  vendor: VendorProfile;
  onCredit: (
    vendor: VendorProfile,
    summary: WalletSummary | undefined,
    accounts: PayoutAccount[],
  ) => void;
}) {
  const { data: summary, isLoading: summaryLoading } = useAdminVendorWalletSummary(vendor.userId);
  const { data: payoutAccounts, isLoading: accountsLoading } =
    useAdminVendorPayoutAccounts(vendor.userId);

  const activeAccounts = (payoutAccounts ?? []).filter((account) => account.active);
  const disabledReason =
    vendor.verificationStatus !== "verified"
      ? "Vendor is not verified"
      : vendor.user?.isActive === false
        ? "Vendor is inactive"
        : "";
  const isLoading = summaryLoading || accountsLoading;

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-medium text-foreground">{displayName(vendor)}</span>
          <span className="text-xs text-muted-foreground">
            #{vendor.userId} - {vendor.user?.phone ?? vendor.user?.email ?? "No contact"}
          </span>
        </div>
      </TableCell>
      <TableCell className="capitalize">{formatCategory(vendor.category)}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {verificationBadge(vendor.verificationStatus)}
          {userStatusBadge(vendor.user?.isActive)}
        </div>
      </TableCell>
      <TableCell>
        {accountsLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : activeAccounts.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm">{accountLabel(activeAccounts[0])}</span>
            {activeAccounts.length > 1 ? (
              <span className="text-xs text-muted-foreground">
                +{activeAccounts.length - 1} more
              </span>
            ) : null}
          </div>
        ) : (
          <Badge variant="outline">Vendor must add account</Badge>
        )}
      </TableCell>
      <TableCell className="text-right font-medium">
        {summaryLoading ? (
          <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          formatCurrency(summary?.availableBalance ?? summary?.pendingSettlement)
        )}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {summaryLoading ? "..." : formatCurrency(summary?.pendingPayouts ?? 0)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {summaryLoading ? "..." : formatCurrency(summary?.paidOut)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading || Boolean(disabledReason)}
            title={disabledReason || "Credit vendor wallet"}
            onClick={() => onCredit(vendor, summary, activeAccounts)}
          >
            <IndianRupee className="mr-1 h-4 w-4" />
            Credit
          </Button>
          {disabledReason ? (
            <span className="max-w-36 text-right text-[11px] text-muted-foreground">
              {disabledReason}
            </span>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function VendorPaymentsAdmin() {
  const { toast } = useToast();
  const { data, isLoading } = useAdminVendors({ limit: 100 });
  const creditWallet = useAdminCreditVendorWallet();
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<WalletSummary | undefined>();
  const [selectedAccounts, setSelectedAccounts] = useState<PayoutAccount[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const vendors = data?.items ?? [];
  const selectedVendorName = useMemo(
    () => (selectedVendor ? displayName(selectedVendor) : "this vendor"),
    [selectedVendor],
  );
  const totalWithdrawable = vendors.length;

  const closeCreditDialog = () => {
    if (creditWallet.isPending) return;
    setSelectedVendor(null);
    setSelectedSummary(undefined);
    setSelectedAccounts([]);
    setAmount("");
    setDescription("");
  };

  const openCreditDialog = (
    vendor: VendorProfile,
    summary: WalletSummary | undefined,
    accounts: PayoutAccount[],
  ) => {
    setSelectedVendor(vendor);
    setSelectedSummary(summary);
    setSelectedAccounts(accounts);
    setAmount("");
    setDescription(`Vendor wallet credit for ${displayName(vendor)}`);
  };

  const submitCredit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVendor) return;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      toast({
        title: "Enter a valid amount",
        description: "Wallet credit amount must be at least INR 1.",
        variant: "destructive",
      });
      return;
    }

    creditWallet.mutate(
      {
        vendorUserId: selectedVendor.userId,
        amount: parsedAmount,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Vendor wallet credited",
            description: `${formatCurrency(parsedAmount)} is now available for vendor withdrawal.`,
          });
          closeCreditDialog();
        },
        onError: (error) =>
          toast({
            title: "Credit failed",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Vendor payments</h2>
          <p className="text-sm text-muted-foreground">
            Credit vendor wallets from admin. Vendors withdraw their available balance from their wallet.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <WalletCards className="h-3.5 w-3.5" />
          {data?.total ?? totalWithdrawable} vendors
        </Badge>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>New payment flow</AlertTitle>
        <AlertDescription>
          Admin no longer recharges a platform wallet. Add credit to the vendor wallet here; the vendor
          completes withdrawal from the wallet page using their saved UPI or bank account.
        </AlertDescription>
      </Alert>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="font-semibold">Vendor wallet credits</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Credit verified vendors, monitor withdrawable balance, and check withdrawal setup.
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <BadgeIndianRupee className="h-3.5 w-3.5" />
            Wallet ledger
          </Badge>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading vendor wallets...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Withdrawal setup</TableHead>
                <TableHead className="text-right">Withdrawable</TableHead>
                <TableHead className="text-right">In withdrawal</TableHead>
                <TableHead className="text-right">Withdrawn</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <VendorWalletRow
                  key={vendor.userId}
                  vendor={vendor}
                  onCredit={openCreditDialog}
                />
              ))}
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No vendors found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={Boolean(selectedVendor)}
        onOpenChange={(open) => {
          if (!open) closeCreditDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Credit vendor wallet</DialogTitle>
            <DialogDescription>
              Add withdrawable balance to {selectedVendorName}. The vendor can withdraw it later.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={submitCredit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Current withdrawable</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(selectedSummary?.availableBalance ?? selectedSummary?.pendingSettlement)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Pending withdrawals</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(selectedSummary?.pendingPayouts ?? 0)}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credit-amount">Amount (INR)</Label>
              <Input
                id="credit-amount"
                type="number"
                min={1}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount to add"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credit-description">Description</Label>
              <Input
                id="credit-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Reason for wallet credit"
              />
            </div>

            {selectedAccounts.length === 0 ? (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Withdrawal account not added</AlertTitle>
                <AlertDescription>
                  You can still credit this wallet. The vendor must add UPI or bank details before withdrawing.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Vendor can withdraw</AlertTitle>
                <AlertDescription>
                  Saved withdrawal account: {accountLabel(selectedAccounts[0])}.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreditDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={creditWallet.isPending || !amount.trim()}>
                {creditWallet.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crediting...
                  </>
                ) : (
                  "Credit wallet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
