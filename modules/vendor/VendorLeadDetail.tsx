"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowLeft,
  ExternalLink,
  Flag,
  Home,
  Loader2,
  MapPin,
  PackageCheck,
  PaintBucket,
  PartyPopper,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  useVendorLead,
  usePatchVendorLeadStatus,
  useAddVendorLeadUpdate,
} from "@/hooks/use-vendor-leads"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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

    if (
      "subType" in parsed ||
      "propertyType" in parsed ||
      "location" in parsed
    ) {
      return { kind: "painting", data: parsed }
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

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const { url } = await api.uploadFile(file)
      setPhotoUrls((prev) => [...prev, url])
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (isLoading || !lead) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/leads">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to leads
        </Link>
      </Button>

      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{lead.customerName}</h1>
          <Badge>{lead.status.replace("_", " ")}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Phone: {lead.phone}</p>
        {lead.area && <p className="text-sm">Area: {lead.area}</p>}
        {lead.budget && <p className="text-sm">Budget: {lead.budget}</p>}
        <RequirementDetails requirement={lead.requirement} />
        {lead.status === "new" && (
          <div className="flex gap-2 pt-2">
            <Button
              disabled={patching}
              onClick={() => patchStatus({ id: lead.id, status: "accepted" })}
            >
              Accept lead
            </Button>
            <Button
              variant="outline"
              disabled={patching}
              onClick={() => patchStatus({ id: lead.id, status: "rejected" })}
            >
              Reject
            </Button>
          </div>
        )}
        {lead.status === "accepted" && (
          <Button
            disabled={patching}
            onClick={() => patchStatus({ id: lead.id, status: "in_progress" })}
          >
            Mark in progress
          </Button>
        )}
      </div>

      {lead.status !== "new" && lead.status !== "rejected" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Work update</h2>
          <div className="space-y-2">
            <Label>Milestone</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
            >
              {MILESTONES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Photos</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleUpload(f)
              }}
            />
            {photoUrls.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {photoUrls.length} file(s) attached
              </p>
            )}
          </div>
          <Button
            disabled={adding}
            onClick={() => {
              addUpdate(
                { id: lead.id, milestone, note: note || undefined, photoUrls },
                {
                  onSuccess: () => {
                    setNote("")
                    setPhotoUrls([])
                    toast({ title: "Update posted" })
                  },
                }
              )
            }}
          >
            Post update
          </Button>
        </div>
      )}

      {lead.updates && lead.updates.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Timeline</h2>
          {lead.updates.map((u) => (
            <div
              key={u.id}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <p className="font-medium">{u.milestone}</p>
              {u.note && <p className="mt-1 text-muted-foreground">{u.note}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {format(new Date(u.createdAt), "PPp")}
              </p>
            </div>
          ))}
        </div>
      )}
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

  if (parsed.kind === "painting") {
    const subType = stringValue(parsed.data.subType)
    const propertyType = stringValue(parsed.data.propertyType)
    const size = stringValue(parsed.data.bhkOrSqft)
    const location = locationPoint(parsed.data.location)

    return (
      <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <PaintBucket className="h-4 w-4 text-primary" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              Painting & Cleaning request
            </p>
            <p className="text-xs text-muted-foreground">
              Customer service details
            </p>
          </div>
        </div>
        <dl className="grid gap-2 sm:grid-cols-3">
          <DetailField
            icon={PaintBucket}
            label="Service"
            value={
              subType
                ? (PAINTING_SUBTYPE_LABELS[subType] ?? readableKey(subType))
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
  icon: typeof Truck
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
  icon: typeof MapPin
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
