"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Flag,
  Home,
  Loader2,
  MapPin,
  Monitor,
  PackageCheck,
  PaintBucket,
  PlusCircle,
  PartyPopper,
  Truck,
  Upload,
  UserRound,
  WalletCards,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetInfo,
} from "next-cloudinary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  useVendorLead,
  usePatchVendorLeadStatus,
  useAddVendorLeadUpdate,
} from "@/hooks/use-vendor-leads"
import { useToast } from "@/hooks/use-toast"
import type { VendorLead, VendorLeadStatus } from "@/schema/vendor-lead"
import {
  canVendorAcceptOrRejectLead,
  canVendorPostWorkUpdate,
} from "@/schema/vendor-lead"
import { formatVendorLeadJobAmount } from "@/lib/vendor/lead-display"

const MB = 1024 * 1024

const MILESTONES = [
  "Customer contacted",
  "Site visit done",
  "Work started",
  "Work completed",
]

const MOVE_TYPE_LABELS: Record<string, string> = {
  home: "Home shifting",
  office: "Office shifting",
  vehicle: "Vehicle transport",
}

const BHK_LABELS: Record<string, string> = {
  "1rk": "1 RK",
  "1": "1 BHK",
  "2": "2 BHK",
  "3": "3 BHK",
  "4+": "4+ BHK",
}

const PAINTING_SUBTYPE_LABELS: Record<string, string> = {
  full_painting: "Full home painting",
  partial_painting: "Partial / room painting",
  deep_cleaning: "Deep home cleaning",
  bathroom_cleaning: "Bathroom cleaning",
  sofa_cleaning: "Sofa / upholstery cleaning",
  kitchen_cleaning: "Kitchen deep cleaning",
}

const HOME_SUBTYPE_LABELS: Record<string, string> = {
  carpenter: "Carpenter",
  plumber: "Plumber",
  electrician: "Electrician",
}

const IT_SUBTYPE_LABELS: Record<string, string> = {
  web_design: "Web design",
  server_tech: "Server tech",
  networking: "Networking / Wi-Fi",
  software_installation: "Software installation",
  cctv_setup: "CCTV setup",
  printer_setup: "Printer setup",
}

const GENERAL_SUBTYPE_LABELS: Record<string, string> = {
  handyman: "Handyman",
  errands: "Errands & assistance",
  furniture_assembly: "Furniture assembly",
  other: "Other general help",
}

const ALL_SUBTYPE_LABELS: Record<string, string> = {
  ...PAINTING_SUBTYPE_LABELS,
  ...HOME_SUBTYPE_LABELS,
  ...IT_SUBTYPE_LABELS,
  ...GENERAL_SUBTYPE_LABELS,
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  villa: "Villa / Independent house",
  office: "Office / Shop",
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby shower",
  corporate: "Corporate event",
}

const VENUE_TYPE_LABELS: Record<string, string> = {
  home: "Home",
  banquet: "Banquet hall",
  hotel: "Hotel",
  outdoor: "Outdoor",
  office: "Office",
  other: "Other",
}

const EVENT_SERVICE_LABELS: Record<string, string> = {
  decoration: "Decoration",
  catering: "Catering",
  home_catering: "Home catering",
  corporate_catering_veg_non_veg: "Corporate catering (veg & non-veg)",
  photography: "Photography",
  music: "Music / DJ",
  hosting: "Host / anchor",
  return_gifts: "Return gifts",
  venue_booking: "Venue booking",
}

const BUDGET_RANGE_LABELS: Record<string, string> = {
  under_50000: "Under 50,000",
  "50000_100000": "50,000 - 1,00,000",
  "100000_250000": "1,00,000 - 2,50,000",
  "250000_500000": "2,50,000 - 5,00,000",
  above_500000: "Above 5,00,000",
}

type JsonRecord = Record<string, unknown>

interface LocationPoint {
  label: string
  lat?: number
  lng?: number
  placeId?: string
  notes?: string
}

type ParsedRequirement =
  | { kind: "empty" }
  | { kind: "text"; text: string }
  | { kind: "packers"; data: JsonRecord }
  | { kind: "painting"; data: JsonRecord }
  | { kind: "home"; data: JsonRecord }
  | { kind: "it"; data: JsonRecord }
  | { kind: "general"; data: JsonRecord }
  | { kind: "event"; data: JsonRecord }
  | { kind: "generic"; data: JsonRecord }

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function locationPoint(value: unknown): LocationPoint | null {
  if (!isRecord(value)) return null
  const label = stringValue(value.label)
  if (!label) return null
  return {
    label,
    lat: numberValue(value.lat),
    lng: numberValue(value.lng),
    placeId: stringValue(value.placeId),
    notes: stringValue(value.notes),
  }
}

function locationPoints(value: unknown): LocationPoint[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => locationPoint(item))
    .filter((item): item is LocationPoint => Boolean(item))
}

function parseRequirement(requirement: string | null): ParsedRequirement {
  if (!requirement?.trim()) return { kind: "empty" }

  try {
    const parsed: unknown = JSON.parse(requirement)
    if (!isRecord(parsed)) return { kind: "text", text: requirement }

    if ("pickup" in parsed || "drops" in parsed || "moveType" in parsed) {
      return { kind: "packers", data: parsed }
    }

    if ("eventType" in parsed || "guestCount" in parsed || "venueType" in parsed) {
      return { kind: "event", data: parsed }
    }

    // Painting / home services include property + location fields.
    // IT / general only send subType (+ notes) — do not treat those as painting.
    if (
      "propertyType" in parsed ||
      "bhkOrSqft" in parsed ||
      "location" in parsed
    ) {
      const subType = stringValue(parsed.subType)
      if (subType && subType in HOME_SUBTYPE_LABELS) {
        return { kind: "home", data: parsed }
      }
      return { kind: "painting", data: parsed }
    }

    if ("subType" in parsed) {
      const subType = stringValue(parsed.subType)
      if (subType && subType in IT_SUBTYPE_LABELS) {
        return { kind: "it", data: parsed }
      }
      if (subType && subType in GENERAL_SUBTYPE_LABELS) {
        return { kind: "general", data: parsed }
      }
      // Unknown simple subtype (e.g. dynamic admin category) — still not painting.
      return { kind: "generic", data: parsed }
    }

    return { kind: "generic", data: parsed }
  } catch {
    return { kind: "text", text: requirement }
  }
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
  if (Array.isArray(value))
    return `${value.length} item${value.length === 1 ? "" : "s"}`
  if (isRecord(value)) return "Provided"
  return "-"
}

function mapsHref(point: LocationPoint): string | null {
  if (point.placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      point.label
    )}&query_place_id=${encodeURIComponent(point.placeId)}`
  }
  if (point.lat != null && point.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`
  }
  return null
}

function statusVariant(status: VendorLeadStatus) {
  if (status === "pending_admin_review") return "outline" as const
  if (status === "open" || status === "new") return "default" as const
  if (status === "accepted" || status === "in_progress") return "secondary" as const
  if (status === "completed") return "outline" as const
  return "destructive" as const
}

function formatStatus(status: VendorLeadStatus) {
  return status.replaceAll("_", " ")
}

export default function VendorLeadDetail() {
  const params = useParams()
  const id = Number(params.id)
  const { data: lead, isLoading } = useVendorLead(
    Number.isFinite(id) ? id : null
  )
  const { mutate: patchStatus, isPending: patching } =
    usePatchVendorLeadStatus()
  const { mutate: addUpdate, isPending: adding } = useAddVendorLeadUpdate()
  const { toast } = useToast()
  const [milestone, setMilestone] = useState(MILESTONES[0])
  const [note, setNote] = useState("")
  const [uploading, setUploading] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"details" | "updates">("details")
  const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  const openCloudinaryWidget = (open: () => void) => {
    if (uploading) return
    if (!cloudinaryPreset) {
      toast({
        title: "Uploads unavailable",
        description:
          "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
        variant: "destructive",
      })
      return
    }
    setUploading(true)
    open()
  }

  const handleCloudinarySuccess = (
    info: CloudinaryUploadWidgetInfo | undefined,
  ) => {
    setUploading(false)
    const uploadedUrl = info?.secure_url
    if (!uploadedUrl) return
    setPhotoUrls((prev) =>
      prev.includes(uploadedUrl) ? prev : [...prev, uploadedUrl],
    )
  }

  if (isLoading || !lead) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/leads">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to leads
        </Link>
      </Button>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {lead.customerName}
              </h1>
              <Badge variant={statusVariant(lead.status)} className="capitalize">
                {formatStatus(lead.status)}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Lead #{lead.id}
              {lead.serviceRequestId
                ? ` from service request #${lead.serviceRequestId}`
                : ""}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <LeadActions lead={lead} patching={patching} onPatch={patchStatus} />
            {canVendorPostWorkUpdate(lead.status) ? (
              <Button
                variant="outline"
                onClick={() => setActiveTab("updates")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Post work update
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid border-t border-border sm:grid-cols-3">
          <SummaryStat icon={MapPin} label="Area" value={lead.area || "-"} />
          <SummaryStat
            icon={WalletCards}
            label="Job amount"
            value={formatVendorLeadJobAmount(lead.jobAmount)}
          />
          <SummaryStat
            icon={CalendarClock}
            label="Created"
            value={format(new Date(lead.createdAt), "dd MMM yyyy")}
          />
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "details" | "updates")
        }
        className="flex flex-col gap-4"
      >
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-border bg-card p-1">
          <TabsTrigger value="details" className="flex-1 sm:flex-none">
            Lead details
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex-1 gap-2 sm:flex-none">
            Work updates
            {(lead.updates?.length ?? 0) > 0 ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {lead.updates?.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <TabsContent value="details" className="mt-0">
              <Accordion
                type="multiple"
                defaultValue={["customer", "requirement"]}
                className="rounded-xl border border-border bg-card px-5"
              >
                <AccordionItem value="customer">
                  <AccordionTrigger className="gap-3 text-left">
                    <SectionHeading icon={UserRound} title="Customer details" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoField label="Customer name" value={lead.customerName} />
                      <InfoField label="Area" value={lead.area || "-"} />
                      <InfoField
                        label="Commission"
                        value={`${lead.commissionPercent}%`}
                      />
                      <InfoField
                        label="Job amount"
                        value={formatVendorLeadJobAmount(lead.jobAmount)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="requirement">
                  <AccordionTrigger className="gap-3 text-left">
                    <SectionHeading
                      icon={ClipboardList}
                      title="Requirement brief"
                    />
                  </AccordionTrigger>
                  <AccordionContent>
                    <RequirementDetails requirement={lead.requirement} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="updates" className="mt-0 space-y-6">
              {canVendorPostWorkUpdate(lead.status) ? (
                <section className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-5">
                    <h2 className="font-heading text-base font-semibold text-foreground">
                      Post a work update
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Share the latest milestone, note, and optional photos for{" "}
                      {lead.customerName}.
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-5"
                    onSubmit={(event) => {
                      event.preventDefault()
                      addUpdate(
                        {
                          id: lead.id,
                          milestone,
                          note: note || undefined,
                          photoUrls,
                        },
                        {
                          onSuccess: () => {
                            setNote("")
                            setPhotoUrls([])
                            setMilestone(MILESTONES[0])
                            toast({ title: "Update posted" })
                          },
                        },
                      )
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lead-milestone">Milestone</Label>
                      <Select value={milestone} onValueChange={setMilestone}>
                        <SelectTrigger id="lead-milestone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MILESTONES.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lead-note">Note</Label>
                      <Textarea
                        id="lead-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={5}
                        placeholder="What changed since the last update?"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lead-photos">Photos</Label>
                      <CldUploadWidget
                        uploadPreset={cloudinaryPreset}
                        options={{
                          multiple: true,
                          maxFileSize: 10 * MB,
                          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                          resourceType: "image",
                          folder: "vendor-lead-updates",
                          sources: ["local", "url", "camera"],
                        }}
                        onSuccess={(result) => {
                          if (result.event !== "success") return
                          const info = result.info
                          if (info && typeof info !== "string") {
                            handleCloudinarySuccess(
                              info as CloudinaryUploadWidgetInfo,
                            )
                          } else {
                            setUploading(false)
                          }
                        }}
                        onError={(error) => {
                          setUploading(false)
                          toast({
                            title: "Upload failed",
                            description:
                              typeof error === "string"
                                ? error
                                : "Please try again.",
                            variant: "destructive",
                          })
                        }}
                        onClose={() => setUploading(false)}
                      >
                        {({ open }) => (
                          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                id="lead-photos"
                                type="button"
                                variant="secondary"
                                disabled={uploading}
                                onClick={() => openCloudinaryWidget(open)}
                              >
                                {uploading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="mr-2 h-4 w-4" />
                                )}
                                {uploading ? "Uploading..." : "Upload"}
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                JPG, PNG or WebP up to 10 MB.
                              </span>
                            </div>

                            {photoUrls.length > 0 ? (
                              <div className="mt-4 flex flex-col gap-2">
                                {photoUrls.map((url, index) => (
                                  <div
                                    key={url}
                                    className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
                                  >
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="min-w-0 truncate text-xs text-muted-foreground hover:text-foreground"
                                    >
                                      Photo {index + 1}
                                    </a>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                      disabled={uploading}
                                      onClick={() =>
                                        setPhotoUrls((prev) =>
                                          prev.filter((item) => item !== url),
                                        )
                                      }
                                    >
                                      <X className="mr-1 h-3.5 w-3.5" />
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </CldUploadWidget>
                      {photoUrls.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {photoUrls.length} file(s) attached
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={adding || uploading}
                        onClick={() => {
                          setNote("")
                          setPhotoUrls([])
                          setMilestone(MILESTONES[0])
                        }}
                      >
                        Clear
                      </Button>
                      <Button type="submit" disabled={adding || uploading}>
                        {adding ? "Posting..." : "Post update"}
                      </Button>
                    </div>
                  </form>
                </section>
              ) : (
                <section className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
                  <p className="text-sm text-muted-foreground">
                    {lead.status === "pending_admin_review"
                      ? "This lead is awaiting admin approval. You can post work updates after it is approved and you accept it."
                      : canVendorAcceptOrRejectLead(lead.status)
                        ? "Accept this lead before posting work updates."
                        : "This lead is closed — work updates can no longer be posted."}
                  </p>
                </section>
              )}

              <section className="rounded-xl border border-border bg-card p-5">
                <SectionHeading icon={CheckCircle2} title="Work timeline" />
                <div className="mt-4">
                  <LeadTimeline
                    updates={lead.updates}
                    createdAt={lead.createdAt}
                  />
                </div>
              </section>
            </TabsContent>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Next best action
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {lead.status === "pending_admin_review"
                  ? "Admin is reviewing this assignment. Accept and reject will unlock after approval."
                  : canVendorAcceptOrRejectLead(lead.status)
                    ? "Accept the lead once you can take the work, or reject it so the team can reassign."
                    : lead.status === "accepted"
                      ? "Move it to in progress after contacting the customer, then post updates on the Work updates tab."
                      : canVendorPostWorkUpdate(lead.status)
                        ? "Keep the customer informed with updates, then mark the lead completed when work is finished."
                        : "This lead is closed for vendor action."}
              </p>
              {canVendorPostWorkUpdate(lead.status) && activeTab === "details" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setActiveTab("updates")}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Go to work updates
                </Button>
              ) : null}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Lead health
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <InfoField label="Status" value={formatStatus(lead.status)} />
                <InfoField
                  label="Last updated"
                  value={format(new Date(lead.updatedAt), "dd MMM yyyy, p")}
                />
                <InfoField
                  label="Updates posted"
                  value={String(lead.updates?.length ?? 0)}
                />
              </div>
            </div>
          </aside>
        </div>
      </Tabs>
    </div>
  )
}

function LeadActions({
  lead,
  patching,
  onPatch,
}: {
  lead: VendorLead
  patching: boolean
  onPatch: (input: { id: number; status: VendorLeadStatus }) => void
}) {
  if (lead.status === "pending_admin_review") {
    return (
      <p className="max-w-xs self-center text-sm text-amber-800">
        Awaiting admin approval before you can accept or reject this lead.
      </p>
    )
  }

  if (canVendorAcceptOrRejectLead(lead.status)) {
    return (
      <>
        <Button
          disabled={patching}
          onClick={() => onPatch({ id: lead.id, status: "accepted" })}
        >
          Accept lead
        </Button>
        <Button
          variant="outline"
          disabled={patching}
          onClick={() => onPatch({ id: lead.id, status: "rejected" })}
        >
          Reject
        </Button>
      </>
    )
  }

  if (lead.status === "accepted") {
    return (
      <>
        <Button
          disabled={patching}
          onClick={() => onPatch({ id: lead.id, status: "in_progress" })}
        >
          Mark in progress
        </Button>
        <Button
          variant="outline"
          disabled={patching}
          onClick={() => onPatch({ id: lead.id, status: "completed" })}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark completed
        </Button>
      </>
    )
  }

  if (lead.status === "in_progress") {
    return (
      <Button
        disabled={patching}
        onClick={() => onPatch({ id: lead.id, status: "completed" })}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Mark completed
      </Button>
    )
  }

  return null
}

// Call customer (masked calling) is temporarily hidden until the feature is ready.
// Restore CustomerContactButton here when re-enabling.

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-t border-border p-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <span className="font-heading text-sm font-semibold">{title}</span>
    </span>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  )
}

function LeadTimeline({
  updates,
  createdAt,
}: {
  updates: VendorLead["updates"]
  createdAt: VendorLead["createdAt"]
}) {
  const items = updates ?? []

  return (
    <div className="flex flex-col gap-4">
      <TimelineItem
        title="Lead created"
        description="Customer enquiry was assigned to your account."
        timestamp={createdAt}
        isFirst
        isLast={items.length === 0}
      />
      {items.map((u, index) => (
        <TimelineItem
          key={u.id}
          title={u.milestone}
          description={u.note || "No note added."}
          timestamp={u.createdAt}
          isLast={index === items.length - 1}
          photos={u.photoUrls ?? []}
        />
      ))}
    </div>
  )
}

function TimelineItem({
  title,
  description,
  timestamp,
  isFirst = false,
  isLast = false,
  photos = [],
}: {
  title: string
  description: string
  timestamp: string | Date
  isFirst?: boolean
  isLast?: boolean
  photos?: string[]
}) {
  return (
    <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3">
      <div className="flex flex-col items-center">
        <span className="mt-1 h-3 w-3 rounded-full border-2 border-primary bg-card" />
        {!isLast ? <span className="mt-1 h-full min-h-10 w-px bg-border" /> : null}
      </div>
      <div className={isFirst ? "pb-1" : "pb-4"}>
        <div className="rounded-lg border border-border bg-card p-3">
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

function RequirementDetails({ requirement }: { requirement: string | null }) {
  const parsed = parseRequirement(requirement)

  if (parsed.kind === "empty") return null

  if (parsed.kind === "text") {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Requirement
        </p>
        <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">
          {parsed.text}
        </p>
      </div>
    )
  }

  if (parsed.kind === "packers") {
    const moveType = stringValue(parsed.data.moveType)
    const bhk = stringValue(parsed.data.bhk)
    const packing = booleanValue(parsed.data.hasPackingMaterial)
    const pickup = locationPoint(parsed.data.pickup)
    const drops = locationPoints(parsed.data.drops)

    return (
      <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Truck className="h-4 w-4 text-primary" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              Packers & Movers request
            </p>
            <p className="text-xs text-muted-foreground">
              Customer move details
            </p>
          </div>
        </div>

        <dl className="grid gap-2 sm:grid-cols-3">
          <DetailField
            icon={Truck}
            label="Move type"
            value={
              moveType
                ? (MOVE_TYPE_LABELS[moveType] ?? readableKey(moveType))
                : "-"
            }
          />
          <DetailField
            icon={Home}
            label="Home size"
            value={bhk ? (BHK_LABELS[bhk] ?? `${bhk} BHK`) : "-"}
          />
          <DetailField
            icon={PackageCheck}
            label="Packing material"
            value={packing == null ? "-" : packing ? "Needed" : "Not needed"}
          />
        </dl>

        {pickup || drops.length > 0 ? (
          <div className="space-y-2">
            {pickup ? (
              <LocationRow
                icon={MapPin}
                tone="pickup"
                label="Pickup"
                point={pickup}
              />
            ) : null}
            {drops.map((drop, index) => (
              <LocationRow
                key={`${drop.label}-${index}`}
                icon={Flag}
                label={`Drop ${index + 1}`}
                point={drop}
              />
            ))}
          </div>
        ) : null}
      </section>
    )
  }

  if (parsed.kind === "painting" || parsed.kind === "home") {
    const subType = stringValue(parsed.data.subType)
    const propertyType = stringValue(parsed.data.propertyType)
    const size = stringValue(parsed.data.bhkOrSqft)
    const location = locationPoint(parsed.data.location)
    const notes = stringValue(parsed.data.notes)
    const isHome = parsed.kind === "home"
    const subtypeLabels = isHome
      ? { ...HOME_SUBTYPE_LABELS, ...PAINTING_SUBTYPE_LABELS }
      : { ...PAINTING_SUBTYPE_LABELS, ...HOME_SUBTYPE_LABELS }
    const Icon = isHome ? Wrench : PaintBucket

    return (
      <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              {isHome ? "Home Services request" : "Painting & Cleaning request"}
            </p>
            <p className="text-xs text-muted-foreground">
              Customer service details
            </p>
          </div>
        </div>
        <dl className="grid gap-2 sm:grid-cols-3">
          <DetailField
            icon={Icon}
            label="Service"
            value={
              subType
                ? (subtypeLabels[subType] ?? readableKey(subType))
                : "-"
            }
          />
          <DetailField
            icon={Home}
            label="Property type"
            value={
              propertyType
                ? (PROPERTY_TYPE_LABELS[propertyType] ??
                  readableKey(propertyType))
                : "-"
            }
          />
          <DetailField icon={PackageCheck} label="Size" value={size ?? "-"} />
        </dl>
        {location ? (
          <LocationRow
            icon={MapPin}
            tone="pickup"
            label="Service location"
            point={location}
          />
        ) : null}
        {notes ? (
          <div className="rounded-md border border-border bg-card p-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Customer notes
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">
              {notes}
            </p>
          </div>
        ) : null}
      </section>
    )
  }

  if (parsed.kind === "it" || parsed.kind === "general") {
    const subType = stringValue(parsed.data.subType)
    const notes = stringValue(parsed.data.notes)
    const isIt = parsed.kind === "it"
    const Icon = isIt ? Monitor : Wrench

    return (
      <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              {isIt ? "IT Services request" : "General Services request"}
            </p>
            <p className="text-xs text-muted-foreground">
              Customer service details
            </p>
          </div>
        </div>
        <dl className="grid gap-2 sm:grid-cols-2">
          <DetailField
            icon={Icon}
            label="Service"
            value={
              subType
                ? (ALL_SUBTYPE_LABELS[subType] ?? readableKey(subType))
                : "-"
            }
          />
        </dl>
        {notes ? (
          <div className="rounded-md border border-border bg-card p-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Customer notes
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">
              {notes}
            </p>
          </div>
        ) : null}
      </section>
    )
  }

  if (parsed.kind === "event") {
    const eventType = stringValue(parsed.data.eventType)
    const venueType = stringValue(parsed.data.venueType)
    const guestCount = numberValue(parsed.data.guestCount)
    const budgetRange = stringValue(parsed.data.budgetRange)
    const themeOrStyle = stringValue(parsed.data.themeOrStyle)
    const notes = stringValue(parsed.data.notes)
    const location = locationPoint(parsed.data.location)
    const services = Array.isArray(parsed.data.services)
      ? parsed.data.services
          .map((service) => stringValue(service))
          .filter((service): service is string => Boolean(service))
      : []

    return (
      <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <PartyPopper className="h-4 w-4 text-primary" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              Event Management request
            </p>
            <p className="text-xs text-muted-foreground">
              Customer event brief
            </p>
          </div>
        </div>
        <dl className="grid gap-2 sm:grid-cols-3">
          <DetailField
            icon={PartyPopper}
            label="Event type"
            value={
              eventType
                ? (EVENT_TYPE_LABELS[eventType] ?? readableKey(eventType))
                : "-"
            }
          />
          <DetailField
            icon={Home}
            label="Venue type"
            value={
              venueType
                ? (VENUE_TYPE_LABELS[venueType] ?? readableKey(venueType))
                : "-"
            }
          />
          <DetailField
            icon={PackageCheck}
            label="Guests"
            value={guestCount != null ? String(guestCount) : "-"}
          />
          <DetailField
            icon={PackageCheck}
            label="Budget"
            value={
              budgetRange
                ? (BUDGET_RANGE_LABELS[budgetRange] ?? readableKey(budgetRange))
                : "Not decided"
            }
          />
          {themeOrStyle ? (
            <DetailField
              icon={PaintBucket}
              label="Theme / style"
              value={themeOrStyle}
            />
          ) : null}
        </dl>

        {services.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <Badge key={service} variant="secondary">
                {EVENT_SERVICE_LABELS[service] ?? readableKey(service)}
              </Badge>
            ))}
          </div>
        ) : null}

        {location ? (
          <LocationRow
            icon={MapPin}
            tone="pickup"
            label="Event location"
            point={location}
          />
        ) : null}

        {notes ? (
          <div className="rounded-md border border-border bg-card p-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Customer notes
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">
              {notes}
            </p>
          </div>
        ) : null}
      </section>
    )
  }

  // Simple subType-only payloads (dynamic IT/general categories, etc.)
  const subType = stringValue(parsed.data.subType)
  const notes = stringValue(parsed.data.notes)
  if (subType) {
    return (
      <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              Service request
            </p>
            <p className="text-xs text-muted-foreground">
              Customer service details
            </p>
          </div>
        </div>
        <dl className="grid gap-2 sm:grid-cols-2">
          <DetailField
            icon={ClipboardList}
            label="Service"
            value={ALL_SUBTYPE_LABELS[subType] ?? readableKey(subType)}
          />
        </dl>
        {notes ? (
          <div className="rounded-md border border-border bg-card p-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Customer notes
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">
              {notes}
            </p>
          </div>
        ) : null}
      </section>
    )
  }

  const entries = Object.entries(parsed.data).filter(
    ([, value]) => value != null && value !== ""
  )

  if (entries.length === 0) return null

  return (
    <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Requirement
      </p>
      <dl className="grid gap-2 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="rounded-md border border-border bg-card p-3"
          >
            <dt className="text-xs text-muted-foreground">
              {readableKey(key)}
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {readableValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

interface DetailFieldProps {
  icon: LucideIcon
  label: string
  value: string
}

function DetailField({ icon: Icon, label, value }: DetailFieldProps) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

interface LocationRowProps {
  icon: LucideIcon
  label: string
  point: LocationPoint
  tone?: "pickup" | "drop"
}

function LocationRow({
  icon: Icon,
  label,
  point,
  tone = "drop",
}: LocationRowProps) {
  const href = mapsHref(point)
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase ${
              tone === "pickup" ? "text-emerald-600" : "text-primary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </p>
          <p className="mt-1 text-sm font-medium break-words text-foreground">
            {point.label}
          </p>
          {point.notes ? (
            <p className="mt-1 text-xs text-muted-foreground">{point.notes}</p>
          ) : null}
        </div>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
          >
            Open
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  )
}
