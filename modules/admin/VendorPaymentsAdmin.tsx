"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  IndianRupee,
  Loader2,
  MoreVertical,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminListPage } from "@/components/admin/admin-list-page";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { VirtualInfiniteList } from "@/components/admin/virtual-infinite-list";
import { useDebouncedValue } from "@/hooks/use-admin-list-controls";
import type {
  LedgerEntry,
  PayoutAccount,
  WalletSummary,
  Withdrawal,
} from "@/end-points/vendor-wallet";
import { useAdminVendors } from "@/hooks/use-vendor-leads";
import {
  useAdminCreditVendorWallet,
  useAdminCancelVendorCreditPayment,
  useAdminSyncVendorCreditPayment,
  useAdminVendorPayoutAccounts,
  useAdminVendorWalletEntriesInfinite,
  useAdminVendorWalletSummary,
  useAdminVendorWithdrawalsInfinite,
} from "@/hooks/use-vendor-wallet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { VendorProfile } from "@/schema/vendor";

function displayName(vendor: VendorProfile) {
  return vendor.businessName || vendor.user?.name || `Vendor #${vendor.userId}`;
}

function formatCategory(cats: any): string {
  if (!cats) return "—"
  const arr = Array.isArray(cats) ? cats : [cats]
  const name = arr
    .map((c: any) => (typeof c === "string" ? c : c?.name || ""))
    .filter(Boolean)
    .map((n: string) => n.replace(/_/g, " "))
    .join(", ")
  return name || "—"
}

function renderCategoryCell(categories: any) {
  const names: string[] = (categories || [])
    .map((c: any) => (typeof c === "string" ? c : c?.name || ""))
    .filter(Boolean)
    .map((n: string) => n.replace(/_/g, " "))

  if (names.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const visible = names.slice(0, 3)
  const overflow = names.length - 3
  const parts = overflow > 0 ? [...visible, `+${overflow} more`] : visible
  const display = parts.join(", ")
  const full = names.join(", ")

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span className="cursor-default">{display}</span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-[min(24rem,calc(100vw-2rem))]"
      >
        {full}
      </TooltipContent>
    </Tooltip>
  )
}

const VERIFICATION_STATUS_OPTIONS = [
  { value: "verified", label: "Verified", className: "" },
  { value: "pending", label: "Pending", className: "" },
  { value: "rejected", label: "Rejected", className: "" },
] as const;

function formatCurrency(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatusLabel(value: string | null | undefined) {
  return (value || "unknown").replace(/_/g, " ");
}

function statusBadgeClass(status: string | null | undefined) {
  const normalized = (status || "").toLowerCase();
  if (["settled", "processed", "captured", "paid"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["payment_pending", "pending", "queued", "processing", "initiated", "requested"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (["failed", "reversed", "cancelled", "rejected"].includes(normalized)) {
    return "border-destructive/30 bg-destructive/5 text-destructive";
  }
  return "border-border bg-muted/50 text-muted-foreground";
}

function paymentLinkUrl(entry: LedgerEntry) {
  const paymentLink = entry.metadata?.paymentLink;
  if (!paymentLink || typeof paymentLink !== "object") return null;
  const shortUrl = (paymentLink as Record<string, unknown>).short_url;
  return typeof shortUrl === "string" && shortUrl ? shortUrl : null;
}

function ledgerStatusHint(entry: LedgerEntry) {
  if (entry.status === "payment_pending") {
    if (entry.vendorLeadId) {
      return "Job settlement payment waiting. Pay the link to credit the vendor wallet, or cancel it from Vendor Payments.";
    }
    return "Manual top-up payment waiting. Pay the link or cancel it to create a new one.";
  }
  if (entry.status !== "failed") return null;

  const closeReason = entry.metadata?.closeReason;
  if (closeReason === "payment_failed") {
    return "Payment attempt failed. No money was added to the wallet.";
  }
  if (closeReason === "admin_cancelled") {
    return "Payment link cancelled by admin. No money was added.";
  }
  if (closeReason === "admin_reopened") {
    return "Payment link closed for settlement adjustment. Issue a new link from Vendor Leads.";
  }
  if (closeReason === "cancelled" || closeReason === "expired") {
    return `Payment link ${closeReason}. No money was added.`;
  }
  if (entry.type === "payout") {
    return "Withdrawal did not complete. Funds remain in the wallet.";
  }
  return "This entry did not complete successfully.";
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

function VendorWithdrawalSetupCell({ vendorUserId }: { vendorUserId: number }) {
  const { data: payoutAccounts, isLoading: accountsLoading } =
    useAdminVendorPayoutAccounts(vendorUserId);
  const activeAccounts = (payoutAccounts ?? []).filter((account) => account.active);

  if (accountsLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (activeAccounts.length > 0) {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm">{accountLabel(activeAccounts[0])}</span>
        {activeAccounts.length > 1 ? (
          <span className="text-xs text-muted-foreground">
            +{activeAccounts.length - 1} more
          </span>
        ) : null}
      </div>
    );
  }

  return <Badge variant="outline">Vendor must add account</Badge>;
}

function VendorWithdrawableCell({ vendorUserId }: { vendorUserId: number }) {
  const { data: summary, isLoading } = useAdminVendorWalletSummary(vendorUserId);
  if (isLoading) {
    return <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />;
  }
  return (
    <span className="font-medium">
      {formatCurrency(summary?.availableBalance ?? summary?.pendingSettlement)}
    </span>
  );
}

function VendorPendingPayoutsCell({ vendorUserId }: { vendorUserId: number }) {
  const { data: summary, isLoading } = useAdminVendorWalletSummary(vendorUserId);
  if (isLoading) return "...";
  return formatCurrency(summary?.pendingPayouts ?? 0);
}

function VendorPaidOutCell({ vendorUserId }: { vendorUserId: number }) {
  const { data: summary, isLoading } = useAdminVendorWalletSummary(vendorUserId);
  if (isLoading) return "...";
  return formatCurrency(summary?.paidOut);
}

function VendorCreditActionCell({
  vendor,
  onCredit,
  onTrack,
}: {
  vendor: VendorProfile;
  onCredit: (
    vendor: VendorProfile,
    summary: WalletSummary | undefined,
    accounts: PayoutAccount[],
  ) => void;
  onTrack: (vendor: VendorProfile) => void;
}) {
  const { data: summary, isLoading: summaryLoading } = useAdminVendorWalletSummary(vendor.userId);
  const { data: payoutAccounts, isLoading: accountsLoading } =
    useAdminVendorPayoutAccounts(vendor.userId);

  const activeAccounts = (payoutAccounts ?? []).filter((account) => account.active);
  const pendingPaymentCredits = summary?.pendingPaymentCredits ?? 0;
  const disabledReason =
    vendor.verificationStatus === "rejected"
      ? "Vendor is rejected"
      : vendor.user?.isActive === false
        ? "Vendor is inactive"
        : pendingPaymentCredits > 0
          ? "Payment link pending"
          : "";
  const isLoading = summaryLoading || accountsLoading;
  const actionHint = isLoading
    ? "Loading..."
    : pendingPaymentCredits > 0
      ? `${formatCurrency(summary?.pendingPaymentCreditAmount)} awaiting payment — Track payments`
      : disabledReason;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" type="button" title="Vendor payment actions">
            <MoreVertical className="size-4" />
            <span className="sr-only">Vendor payment actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => {
              e.preventDefault()
              onTrack(vendor)
            }}
          >
            <Eye className="size-4" />
            Track payments
          </DropdownMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenuItem
                  className="gap-2"
                  disabled={isLoading || Boolean(disabledReason)}
                  onClick={() => onCredit(vendor, summary, activeAccounts)}
                >
                  <IndianRupee className="size-4" />
                  Manual top-up
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            {actionHint ? (
              <TooltipContent side="left">{actionHint}</TooltipContent>
            ) : null}
          </Tooltip>
        </DropdownMenuContent>
      </DropdownMenu>
      {actionHint ? (
        <span className="max-w-36 text-right text-[11px] text-muted-foreground">
          {actionHint}
        </span>
      ) : null}
    </div>
  );
}

function VendorPaymentTrackSheet({
  vendor,
  open,
  onOpenChange,
}: {
  vendor: VendorProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const vendorUserId = vendor?.userId ?? null;
  const [trackTab, setTrackTab] = useState<"ledger" | "withdrawals">("ledger");

  const { data: summary, isLoading: summaryLoading } =
    useAdminVendorWalletSummary(vendorUserId);

  const ledgerQuery = useAdminVendorWalletEntriesInfinite(
    vendorUserId,
    open && trackTab === "ledger",
  );
  const withdrawalsQuery = useAdminVendorWithdrawalsInfinite(
    vendorUserId,
    open && trackTab === "withdrawals",
  );

  const ledgerItems = useMemo(
    () => ledgerQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [ledgerQuery.data],
  );
  const ledgerTotal = ledgerQuery.data?.pages[0]?.total ?? 0;

  const withdrawalItems = useMemo(
    () => withdrawalsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [withdrawalsQuery.data],
  );
  const withdrawalTotal = withdrawalsQuery.data?.pages[0]?.total ?? 0;

  const syncCredit = useAdminSyncVendorCreditPayment(vendorUserId);
  const cancelCredit = useAdminCancelVendorCreditPayment(vendorUserId);
  const drawerScrollRef = useRef<HTMLDivElement>(null);
  const tabsStickySentinelRef = useRef<HTMLDivElement>(null);
  const [tabsStuck, setTabsStuck] = useState(false);
  const [highlightedLedgerId, setHighlightedLedgerId] = useState<number | null>(null);

  const pendingLedgerEntry = useMemo(
    () =>
      ledgerItems.find(
        (entry) => entry.status === "payment_pending" && entry.externalReferenceId,
      ),
    [ledgerItems],
  );
  const pendingPaymentLink = pendingLedgerEntry ? paymentLinkUrl(pendingLedgerEntry) : null;

  useEffect(() => {
    if (!open) {
      setHighlightedLedgerId(null);
      return;
    }
    if (summary?.pendingPaymentCredits && pendingLedgerEntry) {
      setHighlightedLedgerId(pendingLedgerEntry.id);
    }
  }, [open, summary?.pendingPaymentCredits, pendingLedgerEntry?.id]);

  const focusPendingPayment = () => {
    setTrackTab("ledger");
    if (!pendingLedgerEntry) return;

    setHighlightedLedgerId(pendingLedgerEntry.id);
    window.setTimeout(() => {
      const row = document.querySelector(
        `[data-ledger-entry-id="${pendingLedgerEntry.id}"]`,
      );
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (row instanceof HTMLElement) {
        row.focus({ preventScroll: true });
      }
    }, 80);
  };

  useEffect(() => {
    if (!open) {
      setTabsStuck(false);
      return;
    }

    const scrollElement = drawerScrollRef.current;
    const sentinel = tabsStickySentinelRef.current;
    if (!scrollElement || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setTabsStuck(!entry.isIntersecting),
      { root: scrollElement, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, trackTab, summaryLoading, summary?.pendingPaymentCredits]);

  const handleSyncCredit = (entryId: number) => {
    syncCredit.mutate(entryId, {
      onSuccess: (result) => {
        toast({
          title: result.resolved ? "Payment updated" : "Still waiting for payment",
          description: result.message,
          variant: result.resolved ? "default" : undefined,
        });
      },
      onError: (error) => {
        toast({
          title: "Could not check payment",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      },
    });
  };

  const handleCancelCredit = (entryId: number) => {
    cancelCredit.mutate(entryId, {
      onSuccess: (result) => {
        toast({
          title: "Payment link cancelled",
          description: result.message,
        });
      },
      onError: (error) => {
        toast({
          title: "Cancel failed",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full max-h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <SheetHeader className="sticky top-0 z-20 shrink-0 border-b border-border bg-background px-6 pb-4 pt-6 pr-14 text-left">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 font-heading text-xl">
                <ReceiptText className="h-5 w-5 text-primary" />
                {vendor ? displayName(vendor) : "Vendor payment track"}
              </SheetTitle>
              <SheetDescription>
                Job settlement (Vendor Leads), manual top-ups, and withdrawals.
              </SheetDescription>
            </div>
            {summary?.pendingPaymentCredits ? (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                {summary.pendingPaymentCredits} payment pending
              </Badge>
            ) : null}
          </div>
        </SheetHeader>

        <div
          ref={drawerScrollRef}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth"
        >
          <div className="flex flex-col gap-5 px-6 pt-5 pb-2">
            {summary?.pendingPaymentCredits ? (
              <Alert
                className="shrink-0 border-amber-300 bg-amber-50 shadow-md ring-2 ring-amber-200/80"
              >
                <Clock3 className="h-4 w-4 text-amber-700" />
                <AlertTitle className="text-amber-900">
                  {formatCurrency(summary.pendingPaymentCreditAmount)} awaiting payment
                </AlertTitle>
                <AlertDescription className="text-amber-800">
                  <p>
                    Manual top-up stays disabled until you pay the open payment link, check its
                    status, or cancel it. Job settlements are started from Vendor Leads.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pendingPaymentLink ? (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-amber-700 text-white hover:bg-amber-800"
                        onClick={() =>
                          window.open(pendingPaymentLink, "_blank", "noopener,noreferrer")
                        }
                      >
                        <ExternalLink className="size-4" />
                        Open payment link
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-amber-300 bg-background text-amber-900 hover:bg-amber-100/60"
                      onClick={focusPendingPayment}
                      disabled={!pendingLedgerEntry}
                    >
                      <Eye className="size-4" />
                      View in ledger
                    </Button>
                    {pendingLedgerEntry ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-amber-300 bg-background text-amber-900 hover:bg-amber-100/60"
                        onClick={() => handleSyncCredit(pendingLedgerEntry.id)}
                        disabled={syncCredit.isPending}
                      >
                        {syncCredit.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="size-4" />
                        )}
                        Check status
                      </Button>
                    ) : null}
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TrackMetric
                icon={TrendingUp}
                label="Withdrawable"
                value={formatCurrency(summary?.availableBalance ?? summary?.pendingSettlement)}
                isLoading={summaryLoading}
              />
              <TrackMetric
                icon={Clock3}
                label="Payment pending"
                value={formatCurrency(summary?.pendingPaymentCreditAmount)}
                isLoading={summaryLoading}
                highlighted={Boolean(summary?.pendingPaymentCredits)}
              />
              <TrackMetric
                icon={WalletCards}
                label="In withdrawal"
                value={formatCurrency(summary?.pendingPayouts)}
                isLoading={summaryLoading}
              />
              <TrackMetric
                icon={IndianRupee}
                label="Withdrawn"
                value={formatCurrency(summary?.paidOut)}
                isLoading={summaryLoading}
              />
            </div>
          </div>

          <Tabs
            value={trackTab}
            onValueChange={(value) => setTrackTab(value as "ledger" | "withdrawals")}
            className="flex flex-col"
          >
            <div ref={tabsStickySentinelRef} className="h-px shrink-0" aria-hidden />
            <TabsList
              className={cn(
                "sticky top-0 z-10 grid w-full shrink-0 grid-cols-2 rounded-none border-y border-border bg-background px-6 py-1 transition-shadow duration-200",
                tabsStuck && "shadow-md",
              )}
            >
              <TabsTrigger value="ledger">Wallet ledger</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawal requests</TabsTrigger>
            </TabsList>

            <div className="flex flex-col gap-3 px-6 pb-5 pt-4">
              <TabsContent value="ledger" className="mt-0 data-[state=inactive]:hidden">
                <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
                  <TrackSectionHeader
                    icon={ReceiptText}
                    title="Wallet ledger"
                    description="Job settlements, manual top-ups, payouts, and failures."
                    count={ledgerTotal || undefined}
                  />
                  <VirtualInfiniteList
                    scrollElementRef={drawerScrollRef}
                    items={ledgerItems}
                    totalCount={ledgerTotal}
                    isLoading={ledgerQuery.isLoading}
                    isFetchingNextPage={ledgerQuery.isFetchingNextPage}
                    hasNextPage={ledgerQuery.hasNextPage}
                    fetchNextPage={() => void ledgerQuery.fetchNextPage()}
                    getItemKey={(entry) => entry.id}
                    estimateSize={148}
                    loadingLabel="Loading ledger..."
                    emptyLabel="No ledger activity yet."
                    endLabel="All ledger entries loaded"
                    renderItem={(entry) => (
                      <LedgerTrackRow
                        entry={entry}
                        highlighted={highlightedLedgerId === entry.id}
                        onSync={
                          entry.status === "payment_pending" && entry.externalReferenceId
                            ? () => handleSyncCredit(entry.id)
                            : undefined
                        }
                        onCancel={
                          entry.status === "payment_pending" && entry.externalReferenceId
                            ? () => handleCancelCredit(entry.id)
                            : undefined
                        }
                        isSyncing={syncCredit.isPending && syncCredit.variables === entry.id}
                        isCancelling={cancelCredit.isPending && cancelCredit.variables === entry.id}
                      />
                    )}
                  />
                </section>
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-0 data-[state=inactive]:hidden">
                <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
                  <TrackSectionHeader
                    icon={WalletCards}
                    title="Withdrawal requests"
                    description="Payout state, references, UTR, and failure details."
                    count={withdrawalTotal || undefined}
                  />
                  <VirtualInfiniteList
                    scrollElementRef={drawerScrollRef}
                    items={withdrawalItems}
                    totalCount={withdrawalTotal}
                    isLoading={withdrawalsQuery.isLoading}
                    isFetchingNextPage={withdrawalsQuery.isFetchingNextPage}
                    hasNextPage={withdrawalsQuery.hasNextPage}
                    fetchNextPage={() => void withdrawalsQuery.fetchNextPage()}
                    getItemKey={(withdrawal) => withdrawal.id}
                    estimateSize={132}
                    loadingLabel="Loading withdrawals..."
                    emptyLabel="No withdrawal requests yet."
                    endLabel="All withdrawal requests loaded"
                    renderItem={(withdrawal) => (
                      <WithdrawalTrackRow withdrawal={withdrawal} />
                    )}
                  />
                </section>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TrackMetric({
  icon: Icon,
  label,
  value,
  isLoading,
  highlighted = false,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  isLoading: boolean;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-lg border p-3 transition-colors",
        highlighted
          ? "border-amber-400 bg-amber-50/90 shadow-sm ring-2 ring-amber-300/50"
          : "border-border bg-muted/20",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-foreground">
          {isLoading ? "..." : value}
        </p>
      </div>
    </div>
  );
}

function TrackSectionHeader({
  icon: Icon,
  title,
  description,
  count,
}: {
  icon: typeof IndianRupee;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="font-heading text-sm font-semibold">{title}</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {typeof count === "number" ? (
        <Badge variant="secondary">{count} records</Badge>
      ) : null}
    </div>
  );
}

function LedgerTrackRow({
  entry,
  highlighted = false,
  onSync,
  onCancel,
  isSyncing = false,
  isCancelling = false,
}: {
  entry: LedgerEntry;
  highlighted?: boolean;
  onSync?: () => void;
  onCancel?: () => void;
  isSyncing?: boolean;
  isCancelling?: boolean;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const url = paymentLinkUrl(entry);
  const statusHint = ledgerStatusHint(entry);

  return (
    <>
      <div
        data-ledger-entry-id={entry.id}
        tabIndex={highlighted ? -1 : undefined}
        className={cn(
          "grid gap-3 rounded-lg border bg-muted/20 p-3 outline-none sm:grid-cols-[1fr_auto]",
          highlighted
            ? "border-amber-400 bg-amber-50/90 shadow-md ring-2 ring-amber-300/60"
            : "border-border",
        )}
      >
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusBadgeClass(entry.status)}>
              {formatStatusLabel(entry.status)}
            </Badge>
            <span className="text-sm font-medium capitalize">{entry.type}</span>
            <span className="text-sm font-semibold">
              {formatCurrency(entry.amount)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {entry.description || "No description"}
          </p>
          {statusHint ? (
            <p className="rounded-md border border-border/80 bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground">
              {statusHint}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>ID #{entry.id}</span>
            <span>{formatDateTime(entry.createdAt)}</span>
            {entry.externalReferenceId ? (
              <span>Payment link: {entry.externalReferenceId}</span>
            ) : null}
            {entry.webhookEventId ? (
              <span>Webhook: {entry.webhookEventId}</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-start justify-end">
          {url || onSync || onCancel ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  type="button"
                  disabled={isSyncing || isCancelling}
                  title="Payment actions"
                >
                  {isSyncing || isCancelling ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MoreVertical className="size-4" />
                  )}
                  <span className="sr-only">Payment actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {url ? (
                  <DropdownMenuItem
                    className="gap-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="size-4" />
                    Open link
                  </DropdownMenuItem>
                ) : null}
                {onSync ? (
                  <DropdownMenuItem
                    className="gap-2"
                    disabled={isSyncing || isCancelling}
                    onSelect={(e) => {
                      e.preventDefault();
                      onSync();
                    }}
                  >
                    {isSyncing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    {isSyncing ? "Checking..." : "Check status"}
                  </DropdownMenuItem>
                ) : null}
                {onCancel ? (
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
                    disabled={isSyncing || isCancelling}
                    onSelect={(e) => {
                      e.preventDefault();
                      setCancelOpen(true);
                    }}
                  >
                    {isCancelling ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                    {isCancelling ? "Cancelling..." : "Cancel link"}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel payment link?</AlertDialogTitle>
            <AlertDialogDescription>
              This dismisses the {formatCurrency(entry.amount)} payment request. No money
              will be added to the wallet, and you can start a new payment afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep link</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onCancel?.();
                setCancelOpen(false);
              }}
            >
              Cancel link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function WithdrawalTrackRow({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={statusBadgeClass(withdrawal.status)}>
            {formatStatusLabel(withdrawal.status)}
          </Badge>
          <span className="text-sm font-medium">{withdrawal.mode}</span>
          <span className="text-sm font-semibold">
            {formatCurrency(withdrawal.amount)}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          {formatDateTime(withdrawal.updatedAt)}
        </span>
      </div>
      <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        <span>Reference: {withdrawal.referenceId}</span>
        <span>Payout: {withdrawal.razorpayPayoutId || "Not created"}</span>
        <span>Ledger entry: {withdrawal.ledgerEntryId ?? "Not linked"}</span>
        <span>UTR: {withdrawal.utr || "Not available"}</span>
      </div>
      {withdrawal.failureReason ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {withdrawal.failureReason}
        </p>
      ) : null}
    </div>
  );
}

export default function VendorPaymentsAdmin() {
  const { toast } = useToast();
  const { data, isLoading, isError, error } = useAdminVendors({ limit: 100 });
  const creditWallet = useAdminCreditVendorWallet();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [verificationFilter, setVerificationFilter] = useState<
    "all" | VendorProfile["verificationStatus"]
  >("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [trackedVendor, setTrackedVendor] = useState<VendorProfile | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<WalletSummary | undefined>();
  const [selectedAccounts, setSelectedAccounts] = useState<PayoutAccount[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const vendors = data?.items ?? [];

  const verificationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vendors.forEach((vendor) => {
      const s = vendor.verificationStatus;
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return vendors.filter((vendor) => {
      if (
        verificationFilter !== "all" &&
        vendor.verificationStatus !== verificationFilter
      ) {
        return false;
      }
      if (!q) return true;
      const catStr = (vendor.categories || [])
        .map((c: any) => (typeof c === "string" ? c : c?.name))
        .filter(Boolean)
        .join(" ")
      const haystack = [
        displayName(vendor),
        vendor.user?.phone,
        vendor.user?.email,
        catStr,
        String(vendor.userId),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [vendors, debouncedSearch, verificationFilter]);

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

  const columns = useMemo<ColumnDef<VendorProfile, unknown>[]>(
    () => [
      {
        id: "vendor",
        header: "Vendor",
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-medium text-foreground">{displayName(vendor)}</span>
              <span className="text-xs text-muted-foreground">
                #{vendor.userId} - {vendor.user?.phone ?? vendor.user?.email ?? "No contact"}
              </span>
            </div>
          );
        },
      },
      {
        id: "category",
        header: "Category",
        meta: { className: "capitalize" },
        cell: ({ row }) => renderCategoryCell(row.original.categories),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {verificationBadge(row.original.verificationStatus)}
            {userStatusBadge(row.original.user?.isActive)}
          </div>
        ),
      },
      {
        id: "withdrawalSetup",
        header: "Withdrawal setup",
        cell: ({ row }) => <VendorWithdrawalSetupCell vendorUserId={row.original.userId} />,
      },
      {
        id: "withdrawable",
        header: "Withdrawable",
        meta: { className: "text-right" },
        cell: ({ row }) => <VendorWithdrawableCell vendorUserId={row.original.userId} />,
      },
      {
        id: "inWithdrawal",
        header: "In withdrawal",
        meta: { className: "text-right text-muted-foreground text-nowrap" },
        cell: ({ row }) => <VendorPendingPayoutsCell vendorUserId={row.original.userId} />,
      },
      {
        id: "withdrawn",
        header: "Withdrawn",
        meta: { className: "text-right text-muted-foreground" },
        cell: ({ row }) => <VendorPaidOutCell vendorUserId={row.original.userId} />,
      },
      {
        id: "actions",
        header: "Actions",
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <VendorCreditActionCell
            vendor={row.original}
            onCredit={openCreditDialog}
            onTrack={setTrackedVendor}
          />
        ),
      },
    ],
    [openCreditDialog],
  );

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
        onSuccess: (result) => {
          const paymentUrl = result.paymentLink.shortUrl;
          toast({
            title: "Payment link created",
            description:
              "The vendor wallet will be credited after the admin payment is captured.",
            action: paymentUrl ? (
              <ToastAction
                altText="Open payment link"
                onClick={() =>
                  window.open(paymentUrl, "_blank", "noopener,noreferrer")
                }
              >
                Pay now
              </ToastAction>
            ) : undefined,
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

      {/* Custom header to avoid text wrapping issues with description + count badge */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold text-foreground">Vendor payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Job earnings are settled from Vendor Leads (pay to credit). Manual credit here is only for optional top-ups.
          </p>
        </div>
        <div className="sm:pt-0.5 shrink-0">
          <Badge variant="secondary" className="gap-1">
            <WalletCards className="h-3.5 w-3.5" />
            {data?.total ?? vendors.length} vendors
          </Badge>
        </div>
      </div>

      <AdminListPage
        hideHeader
        title="Vendor payments"
        description="Job earnings from Vendor Leads (pay to credit). Manual top-ups only after online payment."
        isLoading={isLoading}
        loadingLabel="Loading vendors…"
        isError={isError}
        error={error}
        errorTitle="Could not load vendors"
        toolbar={
          <AdminToolbar
            statusFilter={{
              value: verificationFilter,
              onChange: (value) => setVerificationFilter(value as typeof verificationFilter),
              options: VERIFICATION_STATUS_OPTIONS as any,
              counts: verificationCounts,
              totalCount: vendors.length,
            }}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search vendor, phone, email, or category…",
            }}
          
          />
        }
        isEmpty={filteredVendors.length === 0}
        emptyTitle="No vendors found"
        emptyDescription="Try clearing search or adjusting filters."
      >
        <AdminDataTable
          columns={columns}
          data={filteredVendors}
          getRowId={(row) => String(row.userId)}
        />
      </AdminListPage>

      <Dialog
        open={Boolean(selectedVendor)}
        onOpenChange={(open) => {
          if (!open) closeCreditDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manual wallet top-up</DialogTitle>
            <DialogDescription>
              Optional bonus or adjustment only — not for job payments. Job amounts must be settled from Vendor Leads. The wallet is credited only after payment is captured.
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
                  You can still create the payment link. The vendor must add UPI or bank details before withdrawing.
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
                    Creating link...
                  </>
                ) : (
                  "Create payment link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <VendorPaymentTrackSheet
        vendor={trackedVendor}
        open={Boolean(trackedVendor)}
        onOpenChange={(open) => {
          if (!open) setTrackedVendor(null);
        }}
      />
    </div>
  );
}
