"use client"

import { useEffect, useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { motion } from "framer-motion"
import {
  Ban,
  BriefcaseBusiness,
  CheckCircle,
  ExternalLink,
  Eye,
  FileCheck2,
  Images,
  MapPin,
  MoreVertical,
  Unlock,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import {
  AdminListEmpty,
  AdminListError,
  AdminListLoading,
} from "@/components/admin/admin-list-states"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminToolbar } from "@/components/admin/admin-toolbar"
import {
  compareStrings,
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls"
import { VENDOR_VERIFICATION_STATUS_OPTIONS } from "@/lib/admin/status-config"
import { useAdminVendors, useAdminUpdateVendor } from "@/hooks/use-vendor-leads"
import { useToast } from "@/hooks/use-toast"
import type { VendorProfile } from "@/schema/vendor"

const PAGE_SIZE = 20
const FETCH_LIMIT = 1000

type StatusFilter = "all" | "pending" | "verified" | "rejected"
type BlockedFilter = "all" | "active" | "blocked"
type VendorSortKey = "partner" | "category" | "phone" | "status"

const DOCUMENT_LABELS: Array<{
  key: keyof NonNullable<VendorProfile["documents"]>
  label: string
}> = [
  { key: "aadhaarUrl", label: "Aadhaar" },
  { key: "panUrl", label: "PAN" },
  { key: "gstUrl", label: "GST certificate" },
  { key: "businessProofUrl", label: "Business proof" },
  { key: "addressProofUrl", label: "Address proof" },
]

function formatCategory(cat: { id: number; name: string } | string) {
  if (typeof cat === 'string') return cat.replace(/_/g, " ")
  return cat.name
}

function displayName(vendor: VendorProfile) {
  return vendor.businessName || vendor.user?.name || `Vendor #${vendor.userId}`
}

function vendorSearchText(vendor: VendorProfile): string {
  const cats = vendor.categories || []
  return [
    displayName(vendor),
    ...cats.map((c: any) => c.name || c),
    vendor.user?.phone,
    vendor.user?.email,
    vendor.rejectionReason,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
}

function compareVendors(a: VendorProfile, b: VendorProfile, key: VendorSortKey): number {
  switch (key) {
    case "partner":
      return compareStrings(displayName(a), displayName(b))
    case "category":
      const aCat = (a.categories && a.categories[0]) ? a.categories[0].name : ""
      const bCat = (b.categories && b.categories[0]) ? b.categories[0].name : ""
      return compareStrings(aCat, bCat)
    case "phone":
      return compareStrings(a.user?.phone ?? "", b.user?.phone ?? "")
    case "status":
      return compareStrings(a.verificationStatus, b.verificationStatus)
  }
}

export default function VendorApprovals() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [blockedFilter, setBlockedFilter] = useState<BlockedFilter>("all")
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null)

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
    filterSheetOpen,
    setFilterSheetOpen,
  } = useAdminListControls<VendorSortKey>({
    defaultSort: { key: "partner", dir: "asc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [statusFilter, categoryFilter, blockedFilter],
  })

  const query = {
    verificationStatus: statusFilter === "all" ? undefined : statusFilter,
    page: 1,
    limit: FETCH_LIMIT,
  }

  const { data, isLoading, isError, error, isFetching } = useAdminVendors(query)
  const { mutate: updateVendor, isPending } = useAdminUpdateVendor()
  const { toast } = useToast()

  const allItems = data?.items ?? []
  const categories = useMemo(
    () => [...new Set(allItems.flatMap((vendor) => (vendor.categories || []).map((c: any) => c.name)))].sort(),
    [allItems],
  )

  const statusCounts = useMemo(
    () => ({
      pending: allItems.filter((vendor) => vendor.verificationStatus === "pending").length,
      verified: allItems.filter((vendor) => vendor.verificationStatus === "verified").length,
      rejected: allItems.filter((vendor) => vendor.verificationStatus === "rejected").length,
    }),
    [allItems],
  )

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const filtered = allItems.filter((vendor) => {
      if (categoryFilter !== "all" && !(vendor.categories || []).some((c: any) => c.name === categoryFilter)) return false
      if (blockedFilter === "blocked" && vendor.user?.isActive !== false) return false
      if (blockedFilter === "active" && vendor.user?.isActive === false) return false
      if (q && !vendorSearchText(vendor).includes(q)) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      const result = compareVendors(a, b, sort.key)
      return sort.dir === "asc" ? result : -result
    })
  }, [allItems, blockedFilter, categoryFilter, debouncedSearch, sort.dir, sort.key])

  const pagedItems = useMemo(
    () => paginateItems(filteredItems, page, PAGE_SIZE),
    [filteredItems, page],
  )

  const clearFilters = () => {
    setCategoryFilter("all")
    setBlockedFilter("all")
  }

  const hasActiveFilters = categoryFilter !== "all" || blockedFilter !== "all"

  const vendorColumns = useMemo<ColumnDef<VendorProfile, unknown>[]>(
    () => [
      {
        id: "partner",
        header: "Partner",
        meta: { sortKey: "partner", className: "min-w-[160px]" },
        cell: ({ row }) => {
          const vendor = row.original
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{displayName(vendor)}</span>
              {vendor.rejectionReason ? (
                <span className="line-clamp-2 text-xs text-destructive">
                  {vendor.rejectionReason}
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "category",
        header: "Category",
        meta: { sortKey: "category" },
        cell: ({ row }) => (
          <span className="capitalize text-muted-foreground">
            {formatCategory((row.original.categories && row.original.categories[0]) || "")}
          </span>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        meta: { sortKey: "phone", className: "hidden sm:table-cell" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.user?.phone ?? "—"}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        meta: { sortKey: "status" },
        cell: ({ row }) => {
          const vendor = row.original
          return (
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge
                status={vendor.verificationStatus}
                options={VENDOR_VERIFICATION_STATUS_OPTIONS}
              />
              {vendor.user?.isActive === false ? (
                <Badge variant="destructive">Blocked</Badge>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <VendorRowActions
            vendor={row.original}
            isPending={isPending}
            onDetails={() => setSelectedVendor(row.original)}
            onUpdate={updateVendor}
            toast={toast}
          />
        ),
      },
    ],
    [isPending, toast, updateVendor],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vendor partners"
        description="Review partners in a sortable table. Use search and filters to narrow results, then approve or manage access."
      />

      {isError ? (
        <AdminListError
          title="Could not load vendors"
          message={(error as Error)?.message ?? "Please refresh the page or try again."}
        />
      ) : null}

      {isLoading ? (
        <AdminListLoading label="Loading vendors…" />
      ) : (
        <div className="w-full space-y-4">
          <AdminToolbar
            statusFilter={{
              value: statusFilter,
              onChange: (value) => setStatusFilter(value as StatusFilter),
              options: VENDOR_VERIFICATION_STATUS_OPTIONS,
              counts: statusCounts,
              totalCount: allItems.length,
            }}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search partner, category, phone, or email…",
            }}
            filterSheet={{
              open: filterSheetOpen,
              onOpenChange: setFilterSheetOpen,
              title: "Filters",
              description: "Narrow by category or account access.",
              hasActiveFilters,
              onClear: clearFilters,
              children: (
                <>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="capitalize">
                            {formatCategory(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Account access</Label>
                    <Select
                      value={blockedFilter}
                      onValueChange={(value) => setBlockedFilter(value as BlockedFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All accounts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All accounts</SelectItem>
                        <SelectItem value="active">Active only</SelectItem>
                        <SelectItem value="blocked">Blocked only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ),
            }}
          />

          {filteredItems.length === 0 ? (
            <AdminListEmpty
              title="No vendors match your filters"
              description="Try All statuses, clearing search, or adjusting filters."
            />
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <AdminDataTable
                columns={vendorColumns}
                data={pagedItems.items}
                getRowId={(vendor) => String(vendor.userId)}
                sort={sort}
                onSort={toggleSort}
              />
            </motion.div>
          )}

          <AdminPagination
            page={pagedItems.page}
            totalPages={pagedItems.totalPages}
            total={pagedItems.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            isFetching={isFetching && !isLoading}
          />
        </div>
      )}

      <VendorDetailSheet
        vendor={selectedVendor}
        onOpenChange={(open) => {
          if (!open) setSelectedVendor(null)
        }}
      />
    </div>
  )
}

function VendorRowActions({
  vendor,
  isPending,
  onDetails,
  onUpdate,
  toast,
}: {
  vendor: VendorProfile
  isPending: boolean
  onDetails: () => void
  onUpdate: ReturnType<typeof useAdminUpdateVendor>["mutate"]
  toast: ReturnType<typeof useToast>["toast"]
}) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" type="button" title="More actions">
            <MoreVertical className="size-4" />
            <span className="sr-only">Partner actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="gap-2"
            onSelect={(e) => {
              e.preventDefault()
              onDetails()
            }}
          >
            <Eye className="size-4" />
            View details
          </DropdownMenuItem>
          {vendor.verificationStatus !== "verified" ? (
            <DropdownMenuItem
              className="gap-2 text-emerald-700 focus:text-emerald-700"
              disabled={isPending}
              onClick={() =>
                onUpdate(
                  { userId: vendor.userId, input: { verificationStatus: "verified" } },
                  { onSuccess: () => toast({ title: "Vendor verified" }) },
                )
              }
            >
              <CheckCircle className="size-4" />
              Approve
            </DropdownMenuItem>
          ) : null}
          {vendor.verificationStatus !== "rejected" ? (
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              disabled={isPending}
              onClick={() =>
                onUpdate(
                  {
                    userId: vendor.userId,
                    input: {
                      verificationStatus: "rejected",
                      rejectionReason: "Did not meet verification requirements",
                    },
                  },
                  { onSuccess: () => toast({ title: "Vendor rejected" }) },
                )
              }
            >
              <XCircle className="size-4" />
              Reject
            </DropdownMenuItem>
          ) : null}
          {vendor.user?.isActive === false ? (
            <DropdownMenuItem
              className="gap-2"
              disabled={isPending}
              onClick={() =>
                onUpdate(
                  { userId: vendor.userId, input: { isActive: true } },
                  { onSuccess: () => toast({ title: "Vendor unblocked" }) },
                )
              }
            >
              <Unlock className="size-4" />
              Unblock
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              disabled={isPending}
              onClick={() =>
                onUpdate(
                  { userId: vendor.userId, input: { isActive: false } },
                  { onSuccess: () => toast({ title: "Vendor blocked" }) },
                )
              }
            >
              <Ban className="size-4" />
              Block
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function VendorDetailSheet({
  vendor,
  onOpenChange,
}: {
  vendor: VendorProfile | null
  onOpenChange: (open: boolean) => void
}) {
  const { mutate: updateVendor, isPending } = useAdminUpdateVendor()
  const { toast } = useToast()

  const docs = vendor?.documents ?? {}
  const uploadedDocs = DOCUMENT_LABELS.filter(({ key }) => Boolean(docs[key]))
  const missingDocs = DOCUMENT_LABELS.length - uploadedDocs.length

  return (
    <Sheet open={Boolean(vendor)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-0 sm:max-w-2xl">
        {vendor ? (
          <ScrollArea className="h-dvh">
            <div className="p-6 pr-8">
              <SheetHeader>
                <SheetTitle className="flex flex-wrap items-center gap-2 pr-6">
                  {displayName(vendor)}
                  <AdminStatusBadge
                    status={vendor.verificationStatus}
                    options={VENDOR_VERIFICATION_STATUS_OPTIONS}
                  />
                  {vendor.user?.isActive === false ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : null}
                </SheetTitle>
                <SheetDescription>
                  Vendor #{vendor.userId} — submitted profile and KYC documents
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6">
                <section className="rounded-xl border border-border bg-card p-4">
                  <SectionTitle icon={BriefcaseBusiness} title="Business profile" />
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailField label="Business name" value={vendor.businessName} />
                    <DetailField label="Category" value={formatCategory((vendor.categories && vendor.categories[0]) || "")} />
                    <DetailField label="Contact name" value={vendor.user?.name} />
                    <DetailField label="Phone" value={vendor.user?.phone} />
                    <DetailField label="Email" value={vendor.user?.email} />
                    <DetailField label="Working hours" value={vendor.workingHours} />
                    <DetailField label="Public slug" value={vendor.slug} />
                    <DetailField
                      label="Account access"
                      value={vendor.user?.isActive === false ? "Blocked" : "Active"}
                    />
                  </dl>
                  {vendor.about ? (
                    <>
                      <Separator className="my-4" />
                      <TextBlock label="About" value={vendor.about} />
                    </>
                  ) : null}
                  {vendor.experience ? (
                    <>
                      <Separator className="my-4" />
                      <TextBlock label="Experience" value={vendor.experience} />
                    </>
                  ) : null}
                </section>

                <section className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <SectionTitle icon={FileCheck2} title="KYC documents" />
                    <Badge variant={missingDocs === 0 ? "default" : "secondary"}>
                      {uploadedDocs.length}/{DOCUMENT_LABELS.length} uploaded
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {DOCUMENT_LABELS.map(({ key, label }) => (
                      <DocumentRow key={key} label={label} url={docs[key] ?? null} />
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-4">
                  <SectionTitle icon={MapPin} title="Service locations" />
                  {vendor.serviceLocations?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vendor.serviceLocations.map((location) => (
                        <Badge key={location} variant="secondary" className="capitalize">
                          {location}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      No service locations added.
                    </p>
                  )}
                </section>

                <AssetLinks
                  icon={Images}
                  title="Public gallery photos"
                  empty="No public gallery photos uploaded."
                  urls={vendor.publicPhotoUrls ?? []}
                />
                <AssetLinks
                  icon={FileCheck2}
                  title="Certificates"
                  empty="No certificates uploaded."
                  urls={vendor.certificateUrls ?? []}
                />
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-primary" aria-hidden />
      <h3 className="font-heading text-sm font-semibold">{title}</h3>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">
        {value?.trim() || "—"}
      </dd>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{value}</p>
    </div>
  )
}

function DocumentRow({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {url ? "Uploaded for review" : "Not uploaded"}
        </p>
      </div>
      {url ? (
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noreferrer">
            View
            <ExternalLink className="ml-1 size-3.5" />
          </a>
        </Button>
      ) : (
        <Badge variant="secondary">Missing</Badge>
      )}
    </div>
  )
}

function AssetLinks({
  icon,
  title,
  empty,
  urls,
}: {
  icon: LucideIcon
  title: string
  empty: string
  urls: string[]
}) {
  const Icon = icon
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle icon={Icon} title={title} />
        {urls.length > 0 ? <Badge variant="secondary">{urls.length}</Badge> : null}
      </div>
      {urls.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3"
            >
              <span className="text-sm font-medium text-foreground">File {index + 1}</span>
              <Button variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noreferrer">
                  View
                  <ExternalLink className="ml-1 size-3.5" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}
