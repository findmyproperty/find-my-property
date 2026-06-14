"use client"

import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  ClipboardList,
  ExternalLink,
  History,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  UserRound,
  WalletCards,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useAdminVendorLead,
  useAdminVendorLeads,
  useAdminPatchVendorLead,
  useAdminVendors,
} from "@/hooks/use-vendor-leads"
import type { VendorLead } from "@/schema/vendor-lead"
import type { VendorLeadStatus } from "@/schema/vendor-lead"
import { useToast } from "@/hooks/use-toast"

const STATUSES: VendorLeadStatus[] = [
  "new",
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
  return status.replace("_", " ")
}

function statusVariant(status: VendorLeadStatus) {
  if (status === "new") return "default" as const
  if (status === "accepted" || status === "in_progress") {
    return "secondary" as const
  }
  if (status === "completed") return "outline" as const
  return "destructive" as const
}

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

export default function VendorLeadsAdmin() {
  const { data, isLoading } = useAdminVendorLeads({ limit: 50 })
  const { data: vendors } = useAdminVendors({ limit: 100 })
  const { mutate: patchLead, isPending } = useAdminPatchVendorLead()
  const { toast } = useToast()
  const [selected, setSelected] = useState<VendorLead | null>(null)
  const [draftStatus, setDraftStatus] = useState<VendorLeadStatus>("new")
  const [jobAmount, setJobAmount] = useState("")
  const { data: selectedDetail, isFetching: isFetchingDetail } =
    useAdminVendorLead(selected?.id ?? null)

  const openLead = (lead: VendorLead) => {
    setSelected(lead)
    setDraftStatus(lead.status)
    setJobAmount(lead.jobAmount != null ? String(lead.jobAmount) : "")
  }

  const save = () => {
    if (!selected) return
    const input: { status?: VendorLeadStatus; jobAmount?: number | null } = {}
    if (draftStatus !== selected.status) input.status = draftStatus
    const amt = jobAmount.trim() ? Number(jobAmount) : null
    if (amt !== selected.jobAmount) input.jobAmount = amt
    if (Object.keys(input).length === 0) return

    patchLead(
      { id: selected.id, input },
      {
        onSuccess: (updated) => {
          openLead(updated)
          toast({
            title:
              updated.status === "completed" && updated.jobAmount
                ? "Lead completed — ledger updated"
                : "Lead saved",
          })
        },
        onError: (e) =>
          toast({
            title: "Save failed",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
      }
    )
  }

  const vendorNameById = new Map(
    (vendors?.items ?? []).map((vendor) => [
      vendor.userId,
      vendor.user?.name || vendor.user?.phone || `Vendor #${vendor.userId}`,
    ])
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold">Vendor leads</h2>
        <p className="text-sm text-muted-foreground">
          Complete jobs with a job amount to post earnings and commission to the
          vendor wallet.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Job amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {vendorNameById.get(lead.vendorUserId) ??
                          `Vendor #${lead.vendorUserId}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ID #{lead.vendorUserId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant(lead.status)}
                      className="capitalize"
                    >
                      {formatStatus(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(lead.jobAmount)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openLead(lead)}
                    >
                      View detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No vendor leads yet. Assign a vendor on a service request.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
            isPending={isPending}
            onStatusChange={setDraftStatus}
            onJobAmountChange={setJobAmount}
            onSave={save}
            onComplete={() => {
              setDraftStatus("completed")
              const amt = Number(jobAmount)
              patchLead(
                {
                  id: selected.id,
                  input: { status: "completed", jobAmount: amt },
                },
                {
                  onSuccess: (updated) => {
                    openLead(updated)
                    toast({
                      title: "Job completed - wallet entries created",
                    })
                  },
                }
              )
            }}
          />
        ) : null}
      </Sheet>
    </div>
  )
}

function AdminLeadDetailSheet({
  lead,
  vendorName,
  isFetchingDetail,
  draftStatus,
  jobAmount,
  isPending,
  onStatusChange,
  onJobAmountChange,
  onSave,
  onComplete,
}: {
  lead: VendorLead
  vendorName: string
  isFetchingDetail: boolean
  draftStatus: VendorLeadStatus
  jobAmount: string
  isPending: boolean
  onStatusChange: (status: VendorLeadStatus) => void
  onJobAmountChange: (value: string) => void
  onSave: () => void
  onComplete: () => void
}) {
  const entries = requirementEntries(lead.requirement)
  const updates = lead.updates ?? []

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
          <Badge variant={statusVariant(lead.status)} className="capitalize">
            {formatStatus(lead.status)}
          </Badge>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-5 py-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailStat icon={Phone} label="Phone" value={lead.phone} />
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
              <SectionTitle icon={WalletCards} title="Status and settlement" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Status</Label>
                  <Select
                    value={draftStatus}
                    onValueChange={(value) =>
                      onStatusChange(value as VendorLeadStatus)
                    }
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
                    placeholder="Required to complete and settle wallet"
                  />
                  <p className="text-xs text-muted-foreground">
                    {lead.commissionPercent}% commission is deducted on
                    completion.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" disabled={isPending} onClick={onSave}>
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={isPending || !jobAmount.trim()}
                  onClick={onComplete}
                >
                  Mark completed and settle
                </Button>
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
