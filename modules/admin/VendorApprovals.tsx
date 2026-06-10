"use client"

import { useState } from "react"
import {
  Ban,
  BriefcaseBusiness,
  CheckCircle,
  ExternalLink,
  Eye,
  FileCheck2,
  Images,
  Loader2,
  MapPin,
  Unlock,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
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
import { useAdminVendors, useAdminUpdateVendor } from "@/hooks/use-vendor-leads"
import { useToast } from "@/hooks/use-toast"
import type { VendorProfile } from "@/schema/vendor"

type VendorFilter = "all" | "pending" | "verified" | "rejected"

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

function formatCategory(category: string) {
  return category.replace(/_/g, " ")
}

function displayName(vendor: VendorProfile) {
  return vendor.businessName || vendor.user?.name || `Vendor #${vendor.userId}`
}

function statusVariant(status: VendorProfile["verificationStatus"]) {
  if (status === "verified") return "default" as const
  if (status === "rejected") return "destructive" as const
  return "secondary" as const
}

export default function VendorApprovals() {
  const [filter, setFilter] = useState<VendorFilter>("pending")
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(
    null
  )
  const query =
    filter === "all"
      ? {}
      : { verificationStatus: filter as Exclude<VendorFilter, "all"> }
  const { data, isLoading } = useAdminVendors(query)
  const { mutate: updateVendor, isPending } = useAdminUpdateVendor()
  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Vendor partners</h2>
          <p className="text-sm text-muted-foreground">
            Approve KYC and manage partner access
          </p>
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as VendorFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {data?.items.map((vendor) => (
          <div
            key={vendor.userId}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{displayName(vendor)}</h3>
                <Badge variant={statusVariant(vendor.verificationStatus)}>
                  {vendor.verificationStatus}
                </Badge>
                {vendor.user?.isActive === false ? (
                  <Badge variant="destructive">Blocked</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground capitalize">
                {formatCategory(vendor.category)} - {vendor.user?.phone ?? "-"}
              </p>
              {vendor.rejectionReason ? (
                <p className="mt-1 text-xs text-destructive">
                  {vendor.rejectionReason}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedVendor(vendor)}
              >
                <Eye className="mr-1 h-4 w-4" />
                Details
              </Button>
              {vendor.verificationStatus !== "verified" ? (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    updateVendor(
                      {
                        userId: vendor.userId,
                        input: { verificationStatus: "verified" },
                      },
                      { onSuccess: () => toast({ title: "Vendor verified" }) }
                    )
                  }
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </Button>
              ) : null}
              {vendor.verificationStatus !== "rejected" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    updateVendor(
                      {
                        userId: vendor.userId,
                        input: {
                          verificationStatus: "rejected",
                          rejectionReason:
                            "Did not meet verification requirements",
                        },
                      },
                      { onSuccess: () => toast({ title: "Vendor rejected" }) }
                    )
                  }
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
              ) : null}
              {vendor.user?.isActive === false ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    updateVendor(
                      { userId: vendor.userId, input: { isActive: true } },
                      { onSuccess: () => toast({ title: "Vendor unblocked" }) }
                    )
                  }
                >
                  <Unlock className="mr-1 h-4 w-4" />
                  Unblock
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isPending}
                  onClick={() =>
                    updateVendor(
                      { userId: vendor.userId, input: { isActive: false } },
                      { onSuccess: () => toast({ title: "Vendor blocked" }) }
                    )
                  }
                >
                  <Ban className="mr-1 h-4 w-4" />
                  Block
                </Button>
              )}
            </div>
          </div>
        ))}
        {!isLoading && data?.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No vendors in this filter
          </p>
        ) : null}
      </div>

      <VendorDetailSheet
        vendor={selectedVendor}
        onOpenChange={(open) => {
          if (!open) setSelectedVendor(null)
        }}
      />
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
                  <Badge variant={statusVariant(vendor.verificationStatus)}>
                    {vendor.verificationStatus}
                  </Badge>
                  {vendor.user?.isActive === false ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : null}
                </SheetTitle>
                <SheetDescription>
                  Vendor #{vendor.userId} - submitted profile and KYC documents
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6">
                <section className="rounded-xl border border-border bg-card p-4">
                  <SectionTitle
                    icon={BriefcaseBusiness}
                    title="Business profile"
                  />
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailField
                      label="Business name"
                      value={vendor.businessName}
                    />
                    <DetailField
                      label="Category"
                      value={formatCategory(vendor.category)}
                    />
                    <DetailField
                      label="Contact name"
                      value={vendor.user?.name}
                    />
                    <DetailField label="Phone" value={vendor.user?.phone} />
                    <DetailField label="Email" value={vendor.user?.email} />
                    <DetailField
                      label="Working hours"
                      value={vendor.workingHours}
                    />
                    <DetailField label="Public slug" value={vendor.slug} />
                    <DetailField
                      label="Account access"
                      value={
                        vendor.user?.isActive === false ? "Blocked" : "Active"
                      }
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
                    <Badge
                      variant={missingDocs === 0 ? "default" : "secondary"}
                    >
                      {uploadedDocs.length}/{DOCUMENT_LABELS.length} uploaded
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {DOCUMENT_LABELS.map(({ key, label }) => (
                      <DocumentRow
                        key={key}
                        label={label}
                        url={docs[key] ?? null}
                      />
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-4">
                  <SectionTitle icon={MapPin} title="Service locations" />
                  {vendor.serviceLocations?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vendor.serviceLocations.map((location) => (
                        <Badge
                          key={location}
                          variant="secondary"
                          className="capitalize"
                        >
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

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: LucideIcon
  title: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <h3 className="font-heading text-sm font-semibold">{title}</h3>
    </div>
  )
}

function DetailField({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-words text-foreground">
        {value?.trim() || "-"}
      </dd>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-foreground">
        {value}
      </p>
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
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
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
        {urls.length > 0 ? (
          <Badge variant="secondary">{urls.length}</Badge>
        ) : null}
      </div>
      {urls.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3"
            >
              <span className="text-sm font-medium text-foreground">
                File {index + 1}
              </span>
              <Button variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noreferrer">
                  View
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
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
