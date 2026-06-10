"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  AlertCircle,
  ArrowUpRight,
  ClipboardList,
  Clock,
  ExternalLink,
  Flag,
  Loader2,
  Mail,
  MessageCircle,
  PaintBucket,
  PartyPopper,
  PhoneCall,
  Route,
  Search,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminServiceRequestStats,
  useAdminServiceRequests,
  useAdminUpdateServiceRequest,
} from "@/hooks/use-service-requests";
import { useAdminVendorSelect } from "@/hooks/use-vendor-leads";
import type {
  EventManagementDetails,
  PackersMoversDetails,
  PaintingCleaningDetails,
  ServiceRequestDTO,
  ServiceRequestStatus,
  ServiceType,
  Stop,
} from "@/lib/api";
import RouteMap from "@/modules/services/RouteMap";

function formatPhoneForLink(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

function formatDuration(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function openInMapsHref(stop: Stop): string {
  if (stop.placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.label)}&query_place_id=${encodeURIComponent(stop.placeId)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`;
}

function isPackersMoversDetails(
  d: ServiceRequestDTO["details"],
): d is PackersMoversDetails {
  return !!d && "moveType" in d;
}

function isPaintingCleaningDetails(
  d: ServiceRequestDTO["details"],
): d is PaintingCleaningDetails {
  return !!d && "subType" in d;
}

function isEventManagementDetails(
  d: ServiceRequestDTO["details"],
): d is EventManagementDetails {
  return !!d && "eventType" in d;
}

const STATUS_VALUES: ServiceRequestStatus[] = [
  "new",
  "contacted",
  "scheduled",
  "completed",
  "cancelled",
];

const SERVICE_VALUES: ServiceType[] = [
  "packers_movers",
  "painting_cleaning",
  "event_management",
];

const STATUS_META: Record<
  ServiceRequestStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "secondary" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const SERVICE_META: Record<
  ServiceType,
  { label: string; icon: typeof Truck }
> = {
  packers_movers: { label: "Packers & Movers", icon: Truck },
  painting_cleaning: { label: "Painting & Cleaning", icon: PaintBucket },
  event_management: { label: "Event Management", icon: PartyPopper },
};

const filterParsers = {
  type: parseAsStringLiteral(["all", ...SERVICE_VALUES] as const).withDefault(
    "all",
  ),
  status: parseAsStringLiteral(["all", ...STATUS_VALUES] as const).withDefault(
    "all",
  ),
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export default function ServiceRequestsAdmin() {
  const [{ type, status, q, page }, setQuery] = useQueryStates(filterParsers, {
    history: "replace",
    shallow: true,
  });

  const [searchDraft, setSearchDraft] = useState(q);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchDraft !== q) {
        setQuery({ q: searchDraft, page: 1 });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchDraft, q, setQuery]);

  const query = useMemo(
    () => ({
      serviceType: type === "all" ? undefined : type,
      status: status === "all" ? undefined : status,
      q: q || undefined,
      page,
      limit: 20,
    }),
    [type, status, q, page],
  );

  const { data, isLoading, isError, error } = useAdminServiceRequests(query);
  const { data: stats } = useAdminServiceRequestStats();
  const updateMutation = useAdminUpdateServiceRequest();
  const { data: vendorOptions } = useAdminVendorSelect();

  const [selected, setSelected] = useState<ServiceRequestDTO | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [draftStatus, setDraftStatus] =
    useState<ServiceRequestStatus>("new");
  const [draftVendorId, setDraftVendorId] = useState<string>("");

  const openRequest = (request: ServiceRequestDTO) => {
    setSelected(request);
    setInternalNotes(request.internalNotes ?? "");
    setDraftStatus(request.status);
    setDraftVendorId(
      request.assignedVendorUserId != null
        ? String(request.assignedVendorUserId)
        : "",
    );
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const saveChanges = async () => {
    if (!selected) return;
    const input: Parameters<
      typeof updateMutation.mutateAsync
    >[0]["input"] = {};
    if (draftStatus !== selected.status) input.status = draftStatus;
    if ((internalNotes ?? "") !== (selected.internalNotes ?? "")) {
      input.internalNotes = internalNotes;
    }
    const vendorId = draftVendorId ? Number(draftVendorId) : null;
    if (vendorId !== (selected.assignedVendorUserId ?? null)) {
      input.assignedVendorUserId = vendorId;
    }
    if (Object.keys(input).length === 0) return;
    const updated = await updateMutation.mutateAsync({ id: selected.id, input });
    setSelected(updated);
    setInternalNotes(updated.internalNotes ?? "");
    setDraftStatus(updated.status);
    setDraftVendorId(
      updated.assignedVendorUserId != null
        ? String(updated.assignedVendorUserId)
        : "",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground mb-1">
            Service Requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Triage Packers &amp; Movers, Painting &amp; Cleaning, and Event Management requests.
          </p>
        </div>
        {stats ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile
              icon={ClipboardList}
              label="Open"
              value={stats.openTotal}
              tone="default"
            />
            <StatTile
              icon={Truck}
              label="Packers & Movers"
              value={stats.totals.packers_movers ?? 0}
            />
            <StatTile
              icon={PaintBucket}
              label="Painting & Cleaning"
              value={stats.totals.painting_cleaning ?? 0}
            />
            <StatTile
              icon={PartyPopper}
              label="Event Management"
              value={stats.totals.event_management ?? 0}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
        <div className="min-w-[200px] flex-1">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <div className="relative mt-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search by name or phone"
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-44">
          <Label className="text-xs text-muted-foreground">Service type</Label>
          <Select
            value={type}
            onValueChange={(v) =>
              setQuery({
                type: v as "all" | ServiceType,
                page: 1,
              })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {SERVICE_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SERVICE_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={status}
            onValueChange={(v) =>
              setQuery({
                status: v as "all" | ServiceRequestStatus,
                page: 1,
              })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(type !== "all" || status !== "all" || q) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchDraft("");
              setQuery({ type: "all", status: "all", q: "", page: 1 });
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3 text-sm"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Could not load service requests
            </p>
            <p className="mt-1 text-muted-foreground">
              {(error as Error)?.message || "Please try again."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Created</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </span>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-16 text-center italic text-muted-foreground"
                >
                  No matching service requests.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => {
                const meta = SERVICE_META[r.serviceType];
                const s = STATUS_META[r.status] ?? STATUS_META.new;
                const pm = isPackersMoversDetails(r.details) ? r.details : null;
                const em = isEventManagementDetails(r.details)
                  ? r.details
                  : null;
                const tripLabel = pm?.trip
                  ? `${pm.trip.distanceKm.toFixed(1)} km · ${formatDuration(pm.trip.durationMin)}`
                  : pm?.drops?.length
                    ? `${pm.drops.length} stop${pm.drops.length === 1 ? "" : "s"}`
                    : "—";
                const detailLabel = em
                  ? `${EVENT_TYPE_LABELS[em.eventType] ?? em.eventType} Â· ${em.guestCount} guests`
                  : tripLabel;
                return (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => openRequest(r)}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs">
                        <meta.icon
                          className="h-3.5 w-3.5 text-primary"
                          aria-hidden
                        />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.variant} className="text-[10px] uppercase text-white">
                        {s.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {r.name}
                    </TableCell>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell>{r.city ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {detailLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRequest(r);
                        }}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > 20 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setQuery({ page: Math.max(1, page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setQuery({ page: page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {SERVICE_META[selected.serviceType].label}
                  <span className="text-sm font-normal text-muted-foreground">
                    #{selected.id}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  Submitted{" "}
                  {formatDistanceToNow(new Date(selected.createdAt), {
                    addSuffix: true,
                  })}
                  {selected.userId ? " · linked to an account" : " · guest submission"}
                </SheetDescription>
              </SheetHeader>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-6"
              >
                <section className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${formatPhoneForLink(selected.phone)}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-primary" aria-hidden />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${formatPhoneForLink(selected.phone).replace(/^\+/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <MessageCircle
                      className="h-3.5 w-3.5 text-emerald-600"
                      aria-hidden
                    />
                    WhatsApp
                  </a>
                  {selected.email ? (
                    <a
                      href={`mailto:${selected.email}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Mail className="h-3.5 w-3.5 text-primary" aria-hidden />
                      Email
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard
                        ?.writeText(selected.phone)
                        .catch(() => {})
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Copy phone
                  </button>
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact
                  </h3>
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <Field label="Name" value={selected.name} />
                    <Field label="Phone" value={selected.phone} />
                    <Field label="Email" value={selected.email ?? "—"} />
                    <Field label="City" value={selected.city ?? "—"} />
                    <Field label="Pincode" value={selected.pincode ?? "—"} />
                    <Field
                      label="Preferred"
                      value={
                        selected.preferredDate
                          ? `${selected.preferredDate}${selected.preferredSlot ? ` · ${selected.preferredSlot}` : ""}`
                          : "Anytime"
                      }
                    />
                    {selected.addressLine ? (
                      <div className="col-span-3">
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm text-foreground">
                          {selected.addressLine}
                        </p>
                      </div>
                    ) : null}
                  </dl>
                </section>

                {isPackersMoversDetails(selected.details) ? (
                  <PackersMoversDetailPanel details={selected.details} />
                ) : null}

                {isPaintingCleaningDetails(selected.details) ? (
                  <PaintingCleaningDetailPanel details={selected.details} />
                ) : null}

                {isEventManagementDetails(selected.details) ? (
                  <EventManagementDetailPanel details={selected.details} />
                ) : null}

                <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Admin update
                  </h3>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={draftStatus}
                      onValueChange={(v) =>
                        setDraftStatus(v as ServiceRequestStatus)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_META[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Assign vendor</Label>
                    <Select
                      value={draftVendorId || "none"}
                      onValueChange={(v) =>
                        setDraftVendorId(v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {vendorOptions?.map((v) => (
                          <SelectItem key={v.userId} value={String(v.userId)}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Internal notes</Label>
                    <Textarea
                      rows={4}
                      placeholder="Visible only to admins."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={saveChanges}
                      disabled={
                        updateMutation.isPending ||
                        (draftStatus === selected.status &&
                          (internalNotes ?? "") ===
                            (selected.internalNotes ?? "") &&
                          (draftVendorId ? Number(draftVendorId) : null) ===
                            (selected.assignedVendorUserId ?? null))
                      }
                    >
                      {updateMutation.isPending ? "Saving…" : "Save changes"}
                    </Button>
                    <Button variant="ghost" onClick={() => setSelected(null)}>
                      Close
                    </Button>
                  </div>
                </section>
              </motion.div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const MOVE_TYPE_LABELS: Record<
  NonNullable<PackersMoversDetails["moveType"]>,
  string
> = {
  home: "Home shifting",
  office: "Office shifting",
  vehicle: "Vehicle transport",
};

const BHK_LABELS: Record<NonNullable<PackersMoversDetails["bhk"]>, string> = {
  "1rk": "1 RK",
  "1": "1 BHK",
  "2": "2 BHK",
  "3": "3 BHK",
  "4+": "4+ BHK",
};

const SUBTYPE_LABELS: Record<
  NonNullable<PaintingCleaningDetails["subType"]>,
  string
> = {
  full_painting: "Full home painting",
  partial_painting: "Partial / room painting",
  deep_cleaning: "Deep home cleaning",
  bathroom_cleaning: "Bathroom cleaning",
  sofa_cleaning: "Sofa / upholstery cleaning",
  kitchen_cleaning: "Kitchen deep cleaning",
};

const PROPERTY_TYPE_LABELS: Record<
  NonNullable<PaintingCleaningDetails["propertyType"]>,
  string
> = {
  apartment: "Apartment",
  villa: "Villa / Independent house",
  office: "Office / Shop",
};

const EVENT_TYPE_LABELS: Record<
  NonNullable<EventManagementDetails["eventType"]>,
  string
> = {
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby shower",
  corporate: "Corporate event",
};

const VENUE_TYPE_LABELS: Record<
  NonNullable<EventManagementDetails["venueType"]>,
  string
> = {
  home: "Home",
  banquet: "Banquet hall",
  hotel: "Hotel",
  outdoor: "Outdoor",
  office: "Office",
  other: "Other",
};

const EVENT_SERVICE_LABELS: Record<
  NonNullable<EventManagementDetails["services"]>[number],
  string
> = {
  decoration: "Decoration",
  catering: "Catering",
  photography: "Photography",
  music: "Music / DJ",
  hosting: "Host / anchor",
  return_gifts: "Return gifts",
  venue_booking: "Venue booking",
};

const BUDGET_RANGE_LABELS: Record<string, string> = {
  under_50000: "Under 50,000",
  "50000_100000": "50,000 - 1,00,000",
  "100000_250000": "1,00,000 - 2,50,000",
  "250000_500000": "2,50,000 - 5,00,000",
  above_500000: "Above 5,00,000",
};

function PackersMoversDetailPanel({ details }: { details: PackersMoversDetails }) {
  const pickup = details.pickup;
  const drops = details.drops ?? [];
  const trip = details.trip;
  const hasStructured = Boolean(pickup) && drops.length > 0;

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Move details
      </h3>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Field
          label="Move type"
          value={MOVE_TYPE_LABELS[details.moveType] ?? details.moveType}
        />
        <Field label="Home size" value={BHK_LABELS[details.bhk] ?? details.bhk} />
        <Field
          label="Packing material"
          value={details.hasPackingMaterial ? "Needed" : "Not needed"}
        />
        {trip ? (
          <Field
            label="Est. trip"
            value={`${trip.distanceKm.toFixed(1)} km · ${formatDuration(trip.durationMin)}`}
          />
        ) : details.distanceKm ? (
          <Field label="Distance" value={`${details.distanceKm} km`} />
        ) : null}
      </dl>

      {trip ? (
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-muted-foreground">
              Distance
            </span>
            <span className="mt-0.5 flex items-center gap-1 font-heading text-lg font-semibold">
              <Route className="h-4 w-4 text-primary" aria-hidden />
              {trip.distanceKm.toFixed(1)} km
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-muted-foreground">
              Drive time
            </span>
            <span className="mt-0.5 flex items-center gap-1 font-heading text-lg font-semibold">
              <Clock className="h-4 w-4 text-primary" aria-hidden />
              {formatDuration(trip.durationMin)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase text-muted-foreground">
              Stops
            </span>
            <span className="mt-0.5 flex items-center gap-1 font-heading text-lg font-semibold">
              <Flag className="h-4 w-4 text-primary" aria-hidden />
              {drops.length}
            </span>
          </div>
        </div>
      ) : null}

      {hasStructured ? (
        <>
          <ol className="space-y-2">
            <li className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                    Pickup
                  </p>
                  <p className="text-sm font-medium text-foreground break-words">
                    {pickup!.label}
                  </p>
                  {pickup!.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pickup!.notes}
                    </p>
                  ) : null}
                </div>
                <a
                  href={openInMapsHref(pickup!)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </div>
            </li>
            {drops.map((d, i) => (
              <li key={i} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Drop {i + 1}
                      {trip?.legs?.[i] ? (
                        <span className="ml-2 font-normal normal-case text-muted-foreground">
                          · {trip.legs[i].distanceKm.toFixed(1)} km ·{" "}
                          {formatDuration(trip.legs[i].durationMin)}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm font-medium text-foreground break-words">
                      {d.label}
                    </p>
                    {d.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.notes}
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={openInMapsHref(d)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </li>
            ))}
          </ol>

          <RouteMap pickup={pickup} drops={drops} height={300} />
        </>
      ) : (
        <dl className="grid grid-cols-1 gap-2 text-sm">
          {details.pickupAddress ? (
            <Field label="Pickup address" value={details.pickupAddress} />
          ) : null}
          {details.dropAddress ? (
            <Field label="Drop address" value={details.dropAddress} />
          ) : null}
        </dl>
      )}

      {details.notes ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Customer notes
          </p>
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
            {details.notes}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function PaintingCleaningDetailPanel({
  details,
}: {
  details: PaintingCleaningDetails;
}) {
  const loc = details.location;
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Service details
      </h3>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Field
          label="Service"
          value={SUBTYPE_LABELS[details.subType] ?? details.subType}
        />
        <Field
          label="Property type"
          value={
            PROPERTY_TYPE_LABELS[details.propertyType] ?? details.propertyType
          }
        />
        <Field label="Size" value={details.bhkOrSqft} />
      </dl>

      {loc && loc.lat !== 0 && loc.lng !== 0 ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  Service location
                </p>
                <p className="text-sm font-medium text-foreground break-words">
                  {loc.label}
                </p>
                {loc.notes ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {loc.notes}
                  </p>
                ) : null}
              </div>
              <a
                href={openInMapsHref(loc)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
              >
                Directions <ArrowUpRight className="h-3 w-3" aria-hidden />
              </a>
            </div>
          </div>
          <RouteMap pickup={loc} drops={[loc]} height={240} />
        </div>
      ) : null}

      {details.notes ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Customer notes
          </p>
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
            {details.notes}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function EventManagementDetailPanel({
  details,
}: {
  details: EventManagementDetails;
}) {
  const loc = details.location;
  const services = details.services ?? [];
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Event details
      </h3>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Field
          label="Event type"
          value={EVENT_TYPE_LABELS[details.eventType] ?? details.eventType}
        />
        <Field
          label="Venue type"
          value={VENUE_TYPE_LABELS[details.venueType] ?? details.venueType}
        />
        <Field label="Guests" value={String(details.guestCount)} />
        <Field
          label="Budget"
          value={
            details.budgetRange
              ? BUDGET_RANGE_LABELS[details.budgetRange] ?? details.budgetRange
              : "Not decided"
          }
        />
        {details.themeOrStyle ? (
          <div className="col-span-2">
            <Field label="Theme / style" value={details.themeOrStyle} />
          </div>
        ) : null}
      </dl>

      {services.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Services needed
          </p>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <Badge key={service} variant="secondary" className="text-xs">
                {EVENT_SERVICE_LABELS[service] ?? service}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {loc && loc.lat !== 0 && loc.lng !== 0 ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  Event location
                </p>
                <p className="text-sm font-medium text-foreground break-words">
                  {loc.label}
                </p>
                {loc.notes ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {loc.notes}
                  </p>
                ) : null}
              </div>
              <a
                href={openInMapsHref(loc)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
              >
                Directions <ArrowUpRight className="h-3 w-3" aria-hidden />
              </a>
            </div>
          </div>
          <RouteMap pickup={loc} drops={[loc]} height={240} />
        </div>
      ) : null}

      {details.notes ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Customer notes
          </p>
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
            {details.notes}
          </p>
        </div>
      ) : null}
    </section>
  );
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground break-words">{value}</p>
    </div>
  );
}

interface StatTileProps {
  icon: typeof Truck;
  label: string;
  value: number;
  tone?: "default" | "muted";
}

function StatTile({ icon: Icon, label, value, tone = "muted" }: StatTileProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 ${
        tone === "default" ? "ring-1 ring-primary/20" : ""
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="font-heading text-lg font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

/** Convenience for admin overview: expose a compact top card set. */
export function ServiceRequestsOverviewTiles() {
  const { data: stats } = useAdminServiceRequestStats();
  if (!stats) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <StatTile
        icon={Sparkles}
        label="Open service requests"
        value={stats.openTotal}
        tone="default"
      />
      <StatTile
        icon={Truck}
        label="Packers & Movers"
        value={stats.totals.packers_movers ?? 0}
      />
      <StatTile
        icon={PaintBucket}
        label="Painting & Cleaning"
        value={stats.totals.painting_cleaning ?? 0}
      />
      <StatTile
        icon={PartyPopper}
        label="Event Management"
        value={stats.totals.event_management ?? 0}
      />
    </div>
  );
}
