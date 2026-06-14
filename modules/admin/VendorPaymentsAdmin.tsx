"use client";

import { FormEvent, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BadgeIndianRupee,
  CheckCircle2,
  IndianRupee,
  Landmark,
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
import type { AdminTopUpMethod } from "@/end-points/admin-wallet";
import type { PayoutAccount } from "@/end-points/vendor-wallet";
import { useAuth } from "@/contexts/auth-context";
import {
  useAdminWalletEntries,
  useAdminWalletSummary,
  useCreateAdminTopUp,
  useVerifyAdminTopUp,
} from "@/hooks/use-admin-wallet";
import { useAdminVendors } from "@/hooks/use-vendor-leads";
import {
  useAdminCreateVendorPayout,
  useAdminVendorPayoutAccounts,
  useAdminVendorWalletSummary,
} from "@/hooks/use-vendor-wallet";
import { useToast } from "@/hooks/use-toast";
import type { VendorProfile } from "@/schema/vendor";

type PayoutMode = "UPI" | "IMPS" | "NEFT" | "RTGS";

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayPaymentFailedResponse = {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
  };
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayCheckoutResponse) => void;
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    callback: (response: RazorpayPaymentFailedResponse) => void,
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayCheckoutScriptPromise: Promise<boolean> | null = null;

function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (!razorpayCheckoutScriptPromise) {
    razorpayCheckoutScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_CHECKOUT_SCRIPT;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayCheckoutScriptPromise;
}

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

function defaultModeForAccount(account: PayoutAccount | undefined): PayoutMode {
  return account?.type === "vpa" ? "UPI" : "IMPS";
}

function accountLabel(account: PayoutAccount) {
  if (account.type === "vpa") {
    return `${account.label ? `${account.label} - ` : ""}${account.vpaAddress ?? "UPI"}`;
  }

  const bankName = account.bankName ? `${account.bankName} ` : "";
  return `${account.label ? `${account.label} - ` : ""}${bankName}ending ${
    account.accountNumberLast4 ?? "----"
  }`;
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

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "settled" || normalized === "processed") {
    return <Badge className="bg-emerald-600 text-white">Settled</Badge>;
  }
  if (normalized === "failed") {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function VendorPaymentRow({
  adminBalance,
  isAdminWalletLoading,
  vendor,
  onPay,
}: {
  adminBalance: number;
  isAdminWalletLoading: boolean;
  vendor: VendorProfile;
  onPay: (vendor: VendorProfile, pendingAmount: number, accounts: PayoutAccount[]) => void;
}) {
  const { data: summary, isLoading: summaryLoading } = useAdminVendorWalletSummary(vendor.userId);
  const { data: payoutAccounts, isLoading: accountsLoading } =
    useAdminVendorPayoutAccounts(vendor.userId);

  const pendingAmount = Number(summary?.pendingSettlement ?? 0);
  const activeAccounts = (payoutAccounts ?? []).filter((account) => account.active);
  const isLoading = summaryLoading || accountsLoading || isAdminWalletLoading;
  const disabledReason =
    vendor.verificationStatus !== "verified"
      ? "Vendor is not verified"
      : vendor.user?.isActive === false
        ? "Vendor is inactive"
        : pendingAmount <= 0
          ? "No pending settlement"
          : activeAccounts.length === 0
            ? "No payout account"
            : adminBalance < pendingAmount
              ? "Insufficient admin wallet balance"
              : "";

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
          <Badge variant="outline">No account</Badge>
        )}
      </TableCell>
      <TableCell className="text-right font-medium">
        {summaryLoading ? (
          <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          formatCurrency(pendingAmount)
        )}
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
            title={disabledReason || "Create RazorpayX payout"}
            onClick={() => onPay(vendor, pendingAmount, activeAccounts)}
          >
            <IndianRupee className="mr-1 h-4 w-4" />
            Pay
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading } = useAdminVendors({ limit: 100 });
  const { data: walletSummary, isLoading: walletLoading } = useAdminWalletSummary();
  const { data: walletEntries, isLoading: walletEntriesLoading } = useAdminWalletEntries(1);
  const createTopUp = useCreateAdminTopUp();
  const verifyTopUp = useVerifyAdminTopUp();
  const createPayout = useAdminCreateVendorPayout();

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpMethod, setTopUpMethod] = useState<AdminTopUpMethod>("upi");
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<PayoutAccount[]>([]);
  const [selectedPayoutAccountId, setSelectedPayoutAccountId] = useState("");
  const [selectedPendingAmount, setSelectedPendingAmount] = useState(0);
  const [amount, setAmount] = useState("");
  const [payoutMode, setPayoutMode] = useState<PayoutMode>("IMPS");
  const [description, setDescription] = useState("");

  const vendors = data?.items ?? [];
  const adminBalance = Number(walletSummary?.balance ?? 0);
  const selectedVendorName = useMemo(
    () => (selectedVendor ? displayName(selectedVendor) : "this vendor"),
    [selectedVendor],
  );
  const selectedAccount = useMemo(
    () => selectedAccounts.find((account) => String(account.id) === selectedPayoutAccountId),
    [selectedAccounts, selectedPayoutAccountId],
  );
  const payoutModes: PayoutMode[] = selectedAccount?.type === "vpa" ? ["UPI"] : ["IMPS", "NEFT", "RTGS"];

  const closeTopUpDialog = () => {
    if (createTopUp.isPending || verifyTopUp.isPending) return;
    setIsTopUpOpen(false);
    setTopUpAmount("");
    setTopUpMethod("upi");
  };

  const closePayoutDialog = () => {
    if (createPayout.isPending) return;
    setSelectedVendor(null);
    setSelectedAccounts([]);
    setSelectedPayoutAccountId("");
    setSelectedPendingAmount(0);
    setAmount("");
    setPayoutMode("IMPS");
    setDescription("");
  };

  const openPayoutDialog = (
    vendor: VendorProfile,
    pendingAmount: number,
    accounts: PayoutAccount[],
  ) => {
    const firstAccount = accounts[0];
    setSelectedVendor(vendor);
    setSelectedAccounts(accounts);
    setSelectedPayoutAccountId(firstAccount ? String(firstAccount.id) : "");
    setSelectedPendingAmount(pendingAmount);
    setPayoutMode(defaultModeForAccount(firstAccount));
    setAmount(pendingAmount > 0 ? String(pendingAmount) : "");
    setDescription(`Admin RazorpayX payout for vendor #${vendor.userId}`);
  };

  const selectPayoutAccount = (accountId: string) => {
    const nextAccount = selectedAccounts.find((account) => String(account.id) === accountId);
    setSelectedPayoutAccountId(accountId);
    setPayoutMode(defaultModeForAccount(nextAccount));
  };

  const submitTopUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(topUpAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      toast({
        title: "Enter a valid top-up amount",
        description: "Wallet top-up amount must be at least INR 1.",
        variant: "destructive",
      });
      return;
    }

    try {
      const topUp = await createTopUp.mutateAsync({
        amount: parsedAmount,
        method: topUpMethod,
        description: "Admin wallet top-up",
      });
      const scriptReady = await loadRazorpayCheckout();
      if (!scriptReady || !window.Razorpay) {
        toast({
          title: "Unable to load Razorpay Checkout",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
        return;
      }

      const checkout = new window.Razorpay({
        key: topUp.keyId,
        amount: topUp.order.amount,
        currency: topUp.order.currency,
        name: "Find My Property",
        description: "Admin wallet top-up",
        order_id: topUp.order.id,
        prefill: {
          name: user?.name ?? undefined,
          email: user?.email ?? undefined,
          contact: user?.phone ?? undefined,
        },
        notes: {
          walletEntryId: String(topUp.walletEntry.id),
          purpose: "admin_wallet_top_up",
        },
        theme: { color: "#0f766e" },
        handler: (response) => {
          verifyTopUp.mutate(
            {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
            {
              onSuccess: () => {
                toast({ title: "Wallet top-up settled" });
                setIsTopUpOpen(false);
                setTopUpAmount("");
                setTopUpMethod("upi");
              },
              onError: (error) =>
                toast({
                  title: "Top-up verification failed",
                  description: error instanceof Error ? error.message : undefined,
                  variant: "destructive",
                }),
            },
          );
        },
      });

      checkout.on("payment.failed", (response) => {
        toast({
          title: "Payment failed",
          description: response.error?.description ?? "Razorpay could not complete this payment.",
          variant: "destructive",
        });
      });
      checkout.open();
    } catch (error) {
      toast({
        title: "Unable to start top-up",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const submitPayout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVendor || !selectedAccount) return;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      toast({
        title: "Enter a valid payout amount",
        variant: "destructive",
      });
      return;
    }

    if (parsedAmount > selectedPendingAmount) {
      toast({
        title: "Amount is above pending settlement",
        description: `This vendor has ${formatCurrency(selectedPendingAmount)} pending.`,
        variant: "destructive",
      });
      return;
    }

    if (parsedAmount > adminBalance) {
      toast({
        title: "Insufficient admin wallet balance",
        description: "Top up the admin wallet before creating this payout.",
        variant: "destructive",
      });
      return;
    }

    createPayout.mutate(
      {
        vendorUserId: selectedVendor.userId,
        payoutAccountId: selectedAccount.id,
        amount: parsedAmount,
        mode: payoutMode,
        description: description.trim() || undefined,
      },
      {
        onSuccess: (withdrawal) => {
          toast({
            title: "RazorpayX payout created",
            description: `Status: ${withdrawal.status}. Reference: ${withdrawal.referenceId}`,
          });
          closePayoutDialog();
        },
        onError: (error) =>
          toast({
            title: "Payout failed",
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
            Fund the admin wallet and release vendor settlements through RazorpayX payouts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <WalletCards className="h-3.5 w-3.5" />
            {data?.total ?? vendors.length} vendors
          </Badge>
          <Button onClick={() => setIsTopUpOpen(true)}>
            <BadgeIndianRupee className="mr-2 h-4 w-4" />
            Top up wallet
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Wallet balance", value: walletSummary?.balance ?? 0 },
          { label: "Pending top-ups", value: walletSummary?.pendingTopUps ?? 0 },
          { label: "Pending payout debits", value: walletSummary?.pendingPayoutDebits ?? 0 },
          { label: "Settled payout debits", value: walletSummary?.payoutDebits ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold">
              {walletLoading ? "..." : formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="font-semibold">Vendor payout queue</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Payouts are blocked until the vendor is verified, active, funded, and has a saved account.
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            RazorpayX
          </Badge>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading vendor payments...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payout account</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Paid out</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <VendorPaymentRow
                  key={vendor.userId}
                  adminBalance={adminBalance}
                  isAdminWalletLoading={walletLoading}
                  vendor={vendor}
                  onPay={openPayoutDialog}
                />
              ))}
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No vendors found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <h3 className="border-b border-border p-4 font-semibold">Admin wallet ledger</h3>
        {walletEntriesLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletEntries?.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">
                    {format(new Date(entry.createdAt), "PP")}
                  </TableCell>
                  <TableCell className="capitalize">{entry.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.referenceId}
                  </TableCell>
                  <TableCell>{statusBadge(entry.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(entry.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {walletEntries?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No admin wallet entries yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={isTopUpOpen}
        onOpenChange={(open) => {
          if (!open) closeTopUpDialog();
          if (open) setIsTopUpOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Top up admin wallet</DialogTitle>
            <DialogDescription>
              Create a Razorpay Checkout order and verify the payment into the platform wallet.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitTopUp}>
            <div className="grid gap-2">
              <Label htmlFor="top-up-amount">Amount (INR)</Label>
              <Input
                id="top-up-amount"
                type="number"
                min={1}
                step="0.01"
                value={topUpAmount}
                onChange={(event) => setTopUpAmount(event.target.value)}
                placeholder="Enter wallet top-up amount"
              />
            </div>

            <div className="grid gap-2">
              <Label>Preferred method</Label>
              <Select
                value={topUpMethod}
                onValueChange={(value) => setTopUpMethod(value as AdminTopUpMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="netbanking">Netbanking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Landmark className="h-4 w-4" />
              <AlertTitle>Checkout verification</AlertTitle>
              <AlertDescription>
                The wallet is credited only after Razorpay signature verification succeeds.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeTopUpDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTopUp.isPending || verifyTopUp.isPending}>
                {createTopUp.isPending || verifyTopUp.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Open Razorpay"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedVendor)}
        onOpenChange={(open) => {
          if (!open) closePayoutDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create vendor payout</DialogTitle>
            <DialogDescription>
              Initiate a RazorpayX payout for {selectedVendorName}. Webhooks will settle or fail the ledger.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitPayout}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Pending settlement</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(selectedPendingAmount)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Admin wallet balance</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(adminBalance)}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Payout account</Label>
              <Select value={selectedPayoutAccountId} onValueChange={selectPayoutAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose payout account" />
                </SelectTrigger>
                <SelectContent>
                  {selectedAccounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {accountLabel(account)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="payout-amount">Amount (INR)</Label>
                <Input
                  id="payout-amount"
                  type="number"
                  min={1}
                  max={selectedPendingAmount || undefined}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter payout amount"
                />
              </div>
              <div className="grid gap-2">
                <Label>Mode</Label>
                <Select
                  value={payoutMode}
                  onValueChange={(value) => setPayoutMode(value as PayoutMode)}
                  disabled={selectedAccount?.type === "vpa"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {payoutModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payout-description">Description</Label>
              <Input
                id="payout-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Admin RazorpayX vendor payout"
              />
            </div>

            {selectedAccount ? (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>RazorpayX payout</AlertTitle>
                <AlertDescription>
                  This will reserve admin wallet balance and create a payout to{" "}
                  {accountLabel(selectedAccount)}.
                </AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePayoutDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPayout.isPending || !selectedAccount || !amount.trim()}
              >
                {createPayout.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create RazorpayX payout"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
