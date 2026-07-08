"use client"

import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { type ColumnDef } from "@tanstack/react-table"
import {
  ClipboardList,
  ExternalLink,
  History,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  UserRound,
  WalletCards,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ToastAction } from "@/components/ui/toast"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useAdminVendorLead,
  useAdminVendorLeads,
  useAdminPatchVendorLead,
  useAdminReopenVendorLeadSettlement,
  useAdminApproveVendorLead,
  useAdminRejectVendorLead,
  useAdminVendors,
} from "@/hooks/use-vendor-leads"
import type { VendorLead, VendorLeadSettlement, VendorLeadStatus } from "@/schema/vendor-lead"
import { useToast } from "@/hooks/use-toast"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminListPage } from "@/components/admin/admin-list-page"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminToolbar } from "@/components/admin/admin-toolbar"
import { useDebouncedValue } from "@/hooks/use-admin-list-controls"
import { VENDOR_LEAD_STATUS_OPTIONS } from "@/lib/admin/status-config"

const PAGE_SIZE = 20

const STATUSES: VendorLeadStatus[] = [
  "pending_admin_review",
  "open",
  "new",
  "admin_rejected",
  "accepted",
  "rejected",
  "in_progress",
  "completed",
]

type RequirementEntry = {
  label: string
  value: string
}

function formatStatus(status: VendorLeadStatus) {
  return status.replaceAll("_", " ")
}

type StatusFilter = "all" | VendorLeadStatus

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "-"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function readableKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function readableValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return String(value)
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    return value
      .map((item) => readableValue(item))
      .filter(Boolean)
      .join(", ")
  }
  if (value && typeof value === "object") {
    const label = "label" in value ? (value as { label?: unknown }).label : null
    if (typeof label === "string" && label.trim()) return label
    return "Provided"
  }
  return "-"
}

function requirementEntries(requirement: string | null): RequirementEntry[] {
  if (!requirement?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(requirement)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [{ label: "Requirement", value: requirement }]
    }

    return Object.entries(parsed)
      .filter(([, value]) => value != null && value !== "")
      .map(([key, value]) => ({
        label: readableKey(key),
        value: readableValue(value),
      }))
  } catch {
    return [{ label: "Requirement", value: requirement }]
  }
}

function leadSearchText(
  lead: VendorLead,
  vendorNameById: Map<number, string>,
): string {
  const vendorLabel =
    vendorNameById.get(lead.vendorUserId) ?? `Vendor #${lead.vendorUserId}`
  return [lead.customerName, lead.phone, lead.area, vendorLabel, String(lead.id)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function showJobSettlementToast(
  toast: ReturnType<typeof useToast>["toast"],
  settlement: VendorLeadSettlement | undefined,
) {
  if (!settlement) return

  const paymentUrl = settlement.paymentLink?.shortUrl
  if (paymentUrl) {
    toast({
      title: "Pay to credit vendor wallet",
      description: settlement.message,
      action: (
        <ToastAction
          altText="Open payment link"
          onClick={() => window.open(paymentUrl, "_blank", "noopener,noreferrer")}
        >
          Pay {formatInr(settlement.netAmount)}
        </ToastAction>
      ),
    })
    return
  }

  toast({
    title: settlement.ledgerStatus === "pending" ? "Job already settled" : "Job marked completed",
    description: settlement.message,
  })
}

type SettlementDialogState = {
  settlement: VendorLeadSettlement
  leadLabel: string
}

function JobSettlementPayDialog({
  state,
  onClose,
}: {
  state: SettlementDialogState | null
  onClose: () => void
}) {
  const paymentUrl = state?.settlement.paymentLink?.shortUrl

  return (
    <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
      {state ? (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Pay to credit vendor wallet</DialogTitle>
            <DialogDescription>{state.settlement.message}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{state.leadLabel}</span>
              <span className="font-semibold text-foreground">
                {formatInr(state.settlement.netAmount)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Commission deducted: {formatInr(state.settlement.commissionAmount)}. The vendor
              wallet is credited only after this payment succeeds.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Skip for now
            </Button>
            <Button
              type="button"
              disabled={!paymentUrl}
              onClick={() => {
                if (paymentUrl) {
                  window.open(paymentUrl, "_blank", "noopener,noreferrer")
                }
                onClose()
              }}
            >
              <ExternalLink className="size-4" />
              Pay {formatInr(state.settlement.netAmount)}
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

export default function VendorLeadsAdmin() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [areaFilter, setAreaFilter] = useState("")

  useEffect(() => {
    setPage(1)
  }, [statusFilter, debouncedSearch, areaFilter])

  const listQuery = {
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: PAGE_SIZE,
  }

  const { data, isLoading, isFetching, isError, error } = useAdminVendorLeads(listQuery)
  const { data: vendors } = useAdminVendors({ limit: 100 })
  const { mutate: patchLead } = useAdminPatchVendorLead()
  const { mutate: reopenSettlement, isPending: isReopenPending } =
    useAdminReopenVendorLeadSettlement()
  const { mutate: approveLead, isPending: isApprovePending } = useAdminApproveVendorLead()
  const { mutate: rejectLead, isPending: isRejectPending } = useAdminRejectVendorLead()
  const { toast } = useToast()
  const [selected, setSelected] = useState<VendorLead | null>(null)
  const [settlementDialog, setSettlementDialog] = useState<SettlementDialogState | null>(null)
  const [settlementEditable, setSettlementEditable] = useState(false)
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [submittingAction, setSubmittingAction] = useState<"save" | "complete" | null>(null)
  const [draftStatus, setDraftStatus] = useState<VendorLeadStatus>("open")
  const [jobAmount, setJobAmount] = useState("")
  const { data: selectedDetail, isFetching: isFetchingDetail } =
    useAdminVendorLead(selected?.id ?? null)

  const openLead = (lead: VendorLead) => {
    setSelected(lead)
    setDraftStatus(lead.status)
    setJobAmount(lead.jobAmount != null ? String(lead.jobAmount) : "")
    setSettlementEditable(false)
    setReopenReason("")
  }

  const activeLead = selectedDetail ?? selected
  const isSettlementLocked = Boolean(
    activeLead?.status === "completed" &&
      activeLead.jobAmount != null &&
      !settlementEditable,
  )

  const handleSettlementResult = (
    updated: VendorLead,
    options: { closeSheet?: boolean; usePayDialog?: boolean; lockSettlement?: boolean } = {},
  ) => {
    if (options.closeSheet) {
      setSelected(null)
    }

    if (options.lockSettlement !== false && updated.status === "completed" && updated.jobAmount) {
      setSettlementEditable(false)
    }

    const settlement = updated.settlement
    if (!settlement) {
      if (updated.status === "completed") {
        toast({ title: "Job marked completed" })
      }
      return
    }

    const paymentUrl = settlement.paymentLink?.shortUrl
    if (paymentUrl && options.usePayDialog) {
      setSettlementDialog({
        settlement,
        leadLabel: `${updated.customerName} · Lead #${updated.id}`,
      })
      return
    }

    showJobSettlementToast(toast, settlement)
  }

  const approveSelectedLead = () => {
    if (!selected) return
    approveLead(
      { id: selected.id },
      {
        onSuccess: (updated) => {
          openLead(updated)
          toast({
            title: "Lead approved",
            description: "The vendor can now accept or reject this lead.",
          })
        },
        onError: (e) =>
          toast({
            title: "Approval failed",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
      },
    )
  }

  const rejectSelectedLead = () => {
    if (!selected || !rejectReason.trim()) return
    rejectLead(
      { id: selected.id, reason: rejectReason.trim() },
      {
        onSuccess: (updated) => {
          openLead(updated)
          setRejectDialogOpen(false)
          setRejectReason("")
          toast({ title: "Lead rejected" })
        },
        onError: (e) =>
          toast({
            title: "Reject failed",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
        onSettled: () => setRejectDialogOpen(false),
      },
    )
  }

  const save = () => {
    if (!selected) return
    const input: { status?: VendorLeadStatus; jobAmount?: number | null } = {}
    if (draftStatus !== selected.status) input.status = draftStatus
    const amt = jobAmount.trim() ? Number(jobAmount) : null
    if (amt !== selected.jobAmount) input.jobAmount = amt
    if (Object.keys(input).length === 0) return

    setSubmittingAction("save")
    patchLead(
      { id: selected.id, input },
      {
        onSuccess: (updated) => {
          openLead(updated)
          if (updated.status === "completed" && updated.jobAmount) {
            handleSettlementResult(updated, { lockSettlement: true })
          } else {
            toast({ title: "Lead saved" })
          }
        },
        onError: (e) =>
          toast({
            title: "Save failed",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
        onSettled: () => setSubmittingAction(null),
      },
    )
  }

  const issuePaymentLink = (closeSheet: boolean) => {
    if (!selected) return
    const amt = Number(jobAmount)
    if (!jobAmount.trim() || Number.isNaN(amt) || amt <= 0) {
      toast({
        title: "Job amount required",
        description: "Enter a valid job amount before creating a payment link.",
        variant: "destructive",
      })
      return
    }

    setSubmittingAction("complete")
    patchLead(
      {
        id: selected.id,
        input: { status: "completed", jobAmount: amt },
      },
      {
        onSuccess: (updated) => {
          openLead(updated)
          handleSettlementResult(updated, {
            closeSheet,
            usePayDialog: true,
            lockSettlement: true,
          })
        },
        onError: (e) =>
          toast({
            title: "Could not create payment link",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
        onSettled: () => setSubmittingAction(null),
      },
    )
  }

  const confirmReopenSettlement = () => {
    if (!selected) return
    const reason = reopenReason.trim()
    if (reason.length < 3) {
      toast({
        title: "Reason required",
        description: "Enter at least 3 characters explaining why settlement is being adjusted.",
        variant: "destructive",
      })
      return
    }

    reopenSettlement(
      { id: selected.id, reason },
      {
        onSuccess: (result) => {
          setSettlementEditable(true)
          setReopenDialogOpen(false)
          setReopenReason("")
          toast({
            title: "Settlement unlocked",
            description: result.reopen.message,
          })
        },
        onError: (e) =>
          toast({
            title: "Could not adjust settlement",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
      },
    )
  }

  const vendorNameById = useMemo(
    () =>
      new Map(
        (vendors?.items ?? []).map((vendor) => [
          vendor.userId,
          vendor.user?.name || vendor.user?.phone || `Vendor #${vendor.userId}`,
        ]),
      ),
    [vendors?.items],
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach((lead: any) => {
      const s = lead.status as string
      counts[s] = (counts[s] || 0) + 1
    })
    return counts
  }, [items])

  const displayItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const area = areaFilter.trim().toLowerCase()
    return items.filter((lead) => {
      if (q && !leadSearchText(lead, vendorNameById).includes(q)) return false
      if (area && !(lead.area ?? "").toLowerCase().includes(area)) return false
      return true
    })
  }, [items, debouncedSearch, areaFilter, vendorNameById])

  const hasActiveFilters = areaFilter.trim() !== ""
  const clearFilters = () => setAreaFilter("")

  const columns = useMemo<ColumnDef<VendorLead, unknown>[]>(
    () => [
      {
        id: "customer",
        header: "Customer",
        meta: { className: "min-w-[9rem]" },
        cell: ({ row }) => (
          <>
            <p className="font-medium">{row.original.customerName}</p>
            <p className="text-xs text-muted-foreground">{row.original.phone}</p>
          </>
        ),
      },
      {
        id: "vendor",
        header: "Vendor",
        meta: { className: "min-w-[10rem]" },
        cell: ({ row }) => {
          const lead = row.original
          return (
            <>
              <p className="text-sm font-medium">
                {vendorNameById.get(lead.vendorUserId) ?? `Vendor #${lead.vendorUserId}`}
              </p>
              <p className="text-xs text-muted-foreground">ID #{lead.vendorUserId}</p>
            </>
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <AdminStatusBadge
            status={row.original.status}
            options={VENDOR_LEAD_STATUS_OPTIONS}
            className="whitespace-nowrap"
          />
        ),
      },
      {
        id: "jobAmount",
        header: "Job amount",
        meta: { className: "whitespace-nowrap" },
        cell: ({ row }) => formatCurrency(row.original.jobAmount),
      },
      {
        id: "created",
        header: "Created",
        meta: { className: "whitespace-nowrap text-xs text-muted-foreground" },
        cell: ({ row }) =>
          formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true }),
      },
      {
        id: "action",
        header: "Actions",
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => openLead(row.original)}>
            View detail
          </Button>
        ),
      },
    ],
    [vendorNameById],
  )

  return (
    <>
      <AdminListPage
        title="Vendor leads"
        description="Complete jobs with a job amount to post earnings and commission to the vendor wallet."
        isLoading={isLoading}
        loadingLabel="Loading vendor leads…"
        isError={isError}
        error={error}
        errorTitle="Could not load vendor leads"
        toolbar={
          <AdminToolbar
            statusFilter={{
              value: statusFilter,
              onChange: (value) => setStatusFilter(value as StatusFilter),
              options: VENDOR_LEAD_STATUS_OPTIONS,
              counts: statusCounts,
              totalCount: total,
            }}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search customer, phone, vendor, or area…",
            }}
            filterSheet={{
              open: filterSheetOpen,
              onOpenChange: setFilterSheetOpen,
              title: "Filters",
              description: "Narrow by service area.",
              hasActiveFilters,
              onClear: clearFilters,
              children: (
                <div className="space-y-2">
                  <Label htmlFor="vendor-lead-area">Area contains</Label>
                  <Input
                    id="vendor-lead-area"
                    placeholder="e.g. Koramangala"
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                  />
                </div>
              ),
            }}
          />
        }
        isEmpty={displayItems.length === 0}
        emptyTitle="No vendor leads match your filters"
        emptyDescription="Assign a vendor on a service request or try All statuses."
        pagination={{
          page,
          totalPages,
          total,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
          isFetching: isFetching && !isLoading,
        }}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card md:hidden">
          <ul className="divide-y divide-border">
            {displayItems.map((lead) => {
              const vendorLabel =
                vendorNameById.get(lead.vendorUserId) ??
                `Vendor #${lead.vendorUserId}`
              return (
                <li key={lead.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
                    onClick={() => openLead(lead)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {lead.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lead.phone}
                        </p>
                      </div>
                      <AdminStatusBadge
                        status={lead.status}
                        options={VENDOR_LEAD_STATUS_OPTIONS}
                        className="shrink-0 text-[10px]"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="min-w-0 text-foreground">
                        {vendorLabel}
                        <span className="ml-1 text-xs text-muted-foreground">
                          · ID #{lead.vendorUserId}
                        </span>
                      </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(lead.jobAmount)}
                      </span>
                      <span className="text-xs">
                        {formatDistanceToNow(new Date(lead.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <AdminDataTable
          className="hidden md:block"
          columns={columns}
          data={displayItems}
          getRowId={(row) => String(row.id)}
        />
      </AdminListPage>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected ? (
          <AdminLeadDetailSheet
            lead={selectedDetail ?? selected}
            vendorName={
              vendorNameById.get(selected.vendorUserId) ??
              `Vendor #${selected.vendorUserId}`
            }
            isFetchingDetail={isFetchingDetail}
            draftStatus={draftStatus}
            jobAmount={jobAmount}
            isSavePending={submittingAction === "save"}
            isCompletePending={submittingAction === "complete"}
            isSettlementLocked={isSettlementLocked}
            settlementEditable={settlementEditable}
            onStatusChange={setDraftStatus}
            onJobAmountChange={setJobAmount}
            onSave={save}
            onAdjustSettlement={() => setReopenDialogOpen(true)}
            onComplete={() => issuePaymentLink(true)}
            onReissuePayment={() => issuePaymentLink(false)}
            onApproveLead={approveSelectedLead}
            onRejectLeadClick={() => setRejectDialogOpen(true)}
            isApprovePending={isApprovePending}
            isRejectPending={isRejectPending}
          />
        ) : null}
      </Sheet>

      <AlertDialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adjust job settlement?</AlertDialogTitle>
            <AlertDialogDescription>
              This cancels any open payment link for this job so you can change the job amount
              and issue a new payment link. The vendor wallet is not changed unless a new payment
              is completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="reopen-reason">Reason for adjustment</Label>
            <Textarea
              id="reopen-reason"
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
              placeholder="e.g. Job amount was recorded incorrectly"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReopenPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isReopenPending || reopenReason.trim().length < 3}
              onClick={(event) => {
                event.preventDefault()
                confirmReopenSettlement()
              }}
            >
              {isReopenPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Unlocking...
                </>
              ) : (
                "Unlock settlement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              The vendor will not be able to accept this assignment. Provide a reason for the
              audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="reject-reason">Rejection reason</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="e.g. Duplicate assignment, customer cancelled"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejectPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRejectPending || !rejectReason.trim()}
              onClick={(event) => {
                event.preventDefault()
                rejectSelectedLead()
              }}
            >
              {isRejectPending ? "Rejecting..." : "Reject lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <JobSettlementPayDialog
        state={settlementDialog}
        onClose={() => setSettlementDialog(null)}
      />
    </>
  )
}

function AdminLeadDetailSheet({
  lead,
  vendorName,
  isFetchingDetail,
  draftStatus,
  jobAmount,
  isSavePending,
  isCompletePending,
  isSettlementLocked,
  settlementEditable,
  onStatusChange,
  onJobAmountChange,
  onSave,
  onAdjustSettlement,
  onComplete,
  onReissuePayment,
  onApproveLead,
  onRejectLeadClick,
  isApprovePending,
  isRejectPending,
}: {
  lead: VendorLead
  vendorName: string
  isFetchingDetail: boolean
  draftStatus: VendorLeadStatus
  jobAmount: string
  isSavePending: boolean
  isCompletePending: boolean
  isSettlementLocked: boolean
  settlementEditable: boolean
  onStatusChange: (status: VendorLeadStatus) => void
  onJobAmountChange: (value: string) => void
  onSave: () => void
  onAdjustSettlement: () => void
  onComplete: () => void
  onReissuePayment: () => void
  onApproveLead: () => void
  onRejectLeadClick: () => void
  isApprovePending: boolean
  isRejectPending: boolean
}) {
  const entries = requirementEntries(lead.requirement)
  const updates = lead.updates ?? []
  const isCompleted = lead.status === "completed"
  const completedWithoutJobAmount =
    isCompleted && (lead.jobAmount == null || Number(lead.jobAmount) <= 0)
  const settlementFieldsDisabled =
    isSettlementLocked ||
    (isCompleted && !settlementEditable && !completedWithoutJobAmount)
  const showAdjustSettlement = isSettlementLocked
  const showInitialComplete = !isCompleted && !isSettlementLocked
  const showReissuePayment = isCompleted && settlementEditable
  const showCreatePaymentForCompleted =
    completedWithoutJobAmount && !isSettlementLocked

  return (
    <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-3xl">
      <SheetHeader className="border-b border-border pb-4 pr-8 text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetTitle className="font-heading text-xl">
              {lead.customerName}
            </SheetTitle>
            <SheetDescription>
              Vendor lead #{lead.id}
              {lead.serviceRequestId
                ? ` from service request #${lead.serviceRequestId}`
                : ""}
            </SheetDescription>
          </div>
          <AdminStatusBadge
            status={lead.status}
            options={VENDOR_LEAD_STATUS_OPTIONS}
          />
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-5 py-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailStat icon={Phone} label="Phone" value={lead.phone ?? "-"} />
          <DetailStat icon={MapPin} label="Area" value={lead.area || "-"} />
          <DetailStat icon={UserRound} label="Vendor" value={vendorName} />
          <DetailStat
            icon={IndianRupee}
            label="Job amount"
            value={formatCurrency(lead.jobAmount)}
          />
        </div>

        <Tabs defaultValue="overview" className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                <SectionTitle icon={ClipboardList} title="Requirement detail" />
                {entries.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {entries.map((entry) => (
                      <InfoBlock
                        key={entry.label}
                        label={entry.label}
                        value={entry.value}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                    No requirement detail was added for this lead.
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                <SectionTitle icon={WalletCards} title="Commercials" />
                <InfoBlock
                  label="Budget"
                  value={lead.budget || "Not provided"}
                />
                <InfoBlock
                  label="Commission"
                  value={`${lead.commissionPercent}%`}
                />
                <InfoBlock
                  label="Preferred date"
                  value={
                    lead.preferredDate
                      ? format(new Date(lead.preferredDate), "dd MMM yyyy")
                      : "Not selected"
                  }
                />
              </section>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionTitle icon={History} title="Work timeline history" />
                <div className="flex items-center gap-2">
                  {isFetchingDetail ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : null}
                  <Badge variant="secondary">
                    {updates.length} update{updates.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>
              <LeadHistory lead={lead} />
            </section>
          </TabsContent>

          <TabsContent value="manage" className="mt-0">
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <SectionTitle icon={WalletCards} title="Status and job payment" />

              {lead.status === "pending_admin_review" ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-3">
                  <p className="text-sm text-amber-900">
                    This lead is waiting for admin approval before the vendor can accept or
                    reject it.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={isApprovePending || isRejectPending}
                      onClick={onApproveLead}
                    >
                      {isApprovePending ? "Approving..." : "Approve lead"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isApprovePending || isRejectPending}
                      onClick={onRejectLeadClick}
                    >
                      Reject lead
                    </Button>
                  </div>
                </div>
              ) : null}

              {lead.adminApprovedAt ? (
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                  Approved{" "}
                  {format(new Date(lead.adminApprovedAt), "dd MMM yyyy, p")}
                  {lead.adminApprovalNotes ? ` — ${lead.adminApprovalNotes}` : ""}
                </div>
              ) : null}

              {lead.adminRejectedAt ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Rejected {format(new Date(lead.adminRejectedAt), "dd MMM yyyy, p")}
                  {lead.adminRejectionReason ? ` — ${lead.adminRejectionReason}` : ""}
                </div>
              ) : null}

              {isSettlementLocked ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-900">
                  Settlement is locked after completion. Use{" "}
                  <span className="font-medium">Adjust settlement</span> to change the job amount
                  and issue a new payment link.
                </div>
              ) : null}

              {showCreatePaymentForCompleted ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  The vendor marked this job completed, but no job amount was set yet. Enter the
                  job amount below, then create the payment link to credit the vendor
                  wallet.
                </div>
              ) : null}

              {settlementEditable && isCompleted ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  Settlement unlocked. Update the job amount, then issue a new payment link.
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Status</Label>
                  <Select
                    value={draftStatus}
                    onValueChange={(value) =>
                      onStatusChange(value as VendorLeadStatus)
                    }
                    disabled={settlementFieldsDisabled || isCompleted}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {formatStatus(status)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Job amount</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={jobAmount}
                    onChange={(event) => onJobAmountChange(event.target.value)}
                    placeholder="Required to complete and create payment link"
                    disabled={settlementFieldsDisabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    {lead.commissionPercent}% commission is deducted. A payment
                    link is created for the net amount — the vendor wallet is credited only
                    after you pay it. Do not use Vendor Payments manual credit for job amounts.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {showAdjustSettlement ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-amber-300 text-amber-900 hover:bg-amber-50"
                    onClick={onAdjustSettlement}
                  >
                    <RotateCcw className="size-4" />
                    Adjust settlement
                  </Button>
                ) : null}

                {!isSettlementLocked && !showReissuePayment ? (
                  <Button
                    variant="outline"
                    disabled={isSavePending || isCompletePending}
                    onClick={onSave}
                  >
                    {isSavePending ? "Saving..." : "Save changes"}
                  </Button>
                ) : null}

                {showInitialComplete ? (
                  <Button
                    variant="secondary"
                    disabled={isSavePending || isCompletePending || !jobAmount.trim()}
                    onClick={onComplete}
                  >
                    {isCompletePending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating payment link...
                      </>
                    ) : (
                      "Mark completed and pay vendor"
                    )}
                  </Button>
                ) : null}

                {showCreatePaymentForCompleted ? (
                  <Button
                    variant="secondary"
                    disabled={isSavePending || isCompletePending || !jobAmount.trim()}
                    onClick={onComplete}
                  >
                    {isCompletePending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating payment link...
                      </>
                    ) : (
                      "Create payment link"
                    )}
                  </Button>
                ) : null}

                {showReissuePayment ? (
                  <Button
                    variant="secondary"
                    disabled={isSavePending || isCompletePending || !jobAmount.trim()}
                    onClick={onReissuePayment}
                  >
                    {isCompletePending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating payment link...
                      </>
                    ) : (
                      "Issue new payment link"
                    )}
                  </Button>
                ) : null}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  )
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Phone; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <h3 className="font-heading text-sm font-semibold">{title}</h3>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  )
}

function LeadHistory({ lead }: { lead: VendorLead }) {
  const updates = lead.updates ?? []

  return (
    <div className="flex flex-col gap-4">
      <TimelineItem
        title="Lead assigned"
        description={`Assigned to vendor #${lead.vendorUserId}.`}
        timestamp={lead.createdAt}
        isLast={updates.length === 0 && lead.updatedAt === lead.createdAt}
      />
      {lead.updatedAt !== lead.createdAt ? (
        <TimelineItem
          title={`Status: ${formatStatus(lead.status)}`}
          description="Latest admin or vendor status on this lead."
          timestamp={lead.updatedAt}
          isLast={updates.length === 0}
        />
      ) : null}
      {updates.map((update, index) => (
        <TimelineItem
          key={update.id}
          title={update.milestone}
          description={update.note || "No note added."}
          timestamp={update.createdAt}
          photos={update.photoUrls ?? []}
          isLast={index === updates.length - 1}
        />
      ))}
      {updates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
          No vendor work updates have been posted yet.
        </p>
      ) : null}
    </div>
  )
}

function TimelineItem({
  title,
  description,
  timestamp,
  photos = [],
  isLast = false,
}: {
  title: string
  description: string
  timestamp: string | Date
  photos?: string[]
  isLast?: boolean
}) {
  return (
    <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3">
      <div className="flex flex-col items-center">
        <span className="mt-1 h-3 w-3 rounded-full border-2 border-primary bg-card" />
        {!isLast ? <span className="mt-1 h-full min-h-10 w-px bg-border" /> : null}
      </div>
      <div className="pb-4">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-foreground">{title}</p>
            <span className="text-xs text-muted-foreground">
              {format(new Date(timestamp), "dd MMM yyyy, p")}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          {photos.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((url, index) => (
                <Button key={`${url}-${index}`} variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noreferrer">
                    Photo {index + 1}
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
