"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock,
  Flag,
  Loader2,
  MapPin,
  PaintBucket,
  PartyPopper,
  Phone,
  Route,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyServiceRequests } from "@/hooks/use-service-requests";
import type {
  EventManagementDetails,
  PackersMoversDetails,
  PaintingCleaningDetails,
  ServiceRequestDTO,
  ServiceRequestStatus,
  ServiceType,
} from "@/lib/api";

function formatDuration(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const SERVICE_META: Record<
  ServiceType,
  { label: string; icon: typeof Truck; href: string }
> = {
  packers_movers: {
    label: "Packers & Movers",
    icon: Truck,
    href: "/packers-movers",
  },
  painting_cleaning: {
    label: "Painting & Cleaning",
    icon: PaintBucket,
    href: "/painting-cleaning",
  },
  event_management: {
    label: "Event Management",
    icon: PartyPopper,
    href: "/event-management",
  },
};

const EVENT_TYPE_LABELS: Record<EventManagementDetails["eventType"], string> = {
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby shower",
  corporate: "Corporate event",
};

const BUDGET_RANGE_LABELS: Record<string, string> = {
  under_50000: "Under 50,000",
  "50000_100000": "50,000 - 1,00,000",
  "100000_250000": "1,00,000 - 2,50,000",
  "250000_500000": "2,50,000 - 5,00,000",
  above_500000: "Above 5,00,000",
};

const STATUS_META: Record<
  ServiceRequestStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "secondary" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

function detailSummary(r: ServiceRequestDTO): string[] {
  if (!r.details) return [];
  if (r.serviceType === "packers_movers") {
    const d = r.details as Extract<
      ServiceRequestDTO["details"],
      { moveType?: string }
    > & { moveType: string; bhk: string };
    return [
      d.moveType ? `${d.moveType} shift` : null,
      d.bhk ? `${d.bhk} BHK` : null,
    ].filter((x): x is string => Boolean(x));
  }
  if (r.serviceType === "painting_cleaning") {
    const d = r.details as Extract<
      ServiceRequestDTO["details"],
      { subType?: string }
    > & { subType: string; propertyType: string; bhkOrSqft: string };
    return [
      d.subType ? d.subType.replaceAll("_", " ") : null,
      d.propertyType ?? null,
      d.bhkOrSqft ?? null,
    ].filter((x): x is string => Boolean(x));
  }
  if (r.serviceType === "event_management") {
    const d = r.details as EventManagementDetails;
    return [
      d.eventType ? EVENT_TYPE_LABELS[d.eventType] ?? d.eventType : null,
      d.guestCount ? `${d.guestCount} guests` : null,
      d.budgetRange ? BUDGET_RANGE_LABELS[d.budgetRange] ?? d.budgetRange : null,
    ].filter((x): x is string => Boolean(x));
  }
  return [];
}

export default function MyServiceRequests() {
  const { data, isLoading, isError, error } = useMyServiceRequests();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">
          My Service Requests
        </h2>
        <p className="text-sm text-muted-foreground">
          Track your Packers & Movers, Painting & Cleaning, and Event Management bookings.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-16 justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your requests…</span>
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">
              Could not load your requests
            </p>
            <p className="text-muted-foreground mt-1">
              {(error as Error)?.message ||
                "Please try again in a moment."}
            </p>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && (!data || data.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">
            No service requests yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Book a service and it will show up here with live status updates.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild size="sm">
              <Link href="/packers-movers">
                <Truck className="mr-2 h-4 w-4" /> Packers & Movers
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/painting-cleaning">
                <PaintBucket className="mr-2 h-4 w-4" /> Painting & Cleaning
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/event-management">
                <PartyPopper className="mr-2 h-4 w-4" /> Event Management
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && data && data.length > 0 ? (
        <div className="grid gap-3">
          {data.map((r, i) => {
            const meta = SERVICE_META[r.serviceType];
            const status = STATUS_META[r.status] ?? STATUS_META.new;
            const summary = detailSummary(r);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <meta.icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground text-sm">
                      {meta.label}
                    </h3>
                    <Badge
                      variant={status.variant}
                      className="text-[10px] uppercase"
                    >
                      {status.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      #{r.id}
                    </span>
                  </div>
                  {summary.length > 0 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                      {summary.join(" · ")}
                    </p>
                  ) : null}
                  <LocationStrip request={r} />
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" aria-hidden />
                      {r.phone}
                    </span>
                    {r.city ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" aria-hidden />
                        {r.city}
                      </span>
                    ) : null}
                    {r.preferredDate ? (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" aria-hidden />
                        {r.preferredDate}
                        {r.preferredSlot ? ` · ${r.preferredSlot}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={meta.href}>
                      Book again
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function LocationStrip({ request }: { request: ServiceRequestDTO }) {
  if (request.serviceType === "packers_movers") {
    const d = request.details as PackersMoversDetails | null;
    if (!d) return null;
    const pickup = d.pickup?.label ?? d.pickupAddress;
    const drops =
      d.drops && d.drops.length > 0
        ? d.drops.map((x) => x.label)
        : d.dropAddress
          ? [d.dropAddress]
          : [];
    if (!pickup && drops.length === 0) return null;
    return (
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {pickup ? (
          <p className="flex items-start gap-1.5">
            <MapPin
              className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600"
              aria-hidden
            />
            <span className="line-clamp-1">{pickup}</span>
          </p>
        ) : null}
        {drops.map((label, i) => (
          <p key={i} className="flex items-start gap-1.5">
            <Flag
              className="mt-0.5 h-3 w-3 shrink-0 text-primary"
              aria-hidden
            />
            <span className="line-clamp-1">
              {drops.length > 1 ? `Drop ${i + 1}: ` : ""}
              {label}
            </span>
          </p>
        ))}
        {d.trip ? (
          <p className="flex items-center gap-3 pt-0.5 text-foreground/80">
            <span className="inline-flex items-center gap-1">
              <Route className="h-3 w-3" aria-hidden />
              {d.trip.distanceKm.toFixed(1)} km
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {formatDuration(d.trip.durationMin)}
            </span>
          </p>
        ) : null}
      </div>
    );
  }
  if (request.serviceType === "painting_cleaning") {
    const d = request.details as PaintingCleaningDetails | null;
    const label = d?.location?.label;
    if (!label) return null;
    return (
      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden />
        <span className="line-clamp-1">{label}</span>
      </p>
    );
  }
  if (request.serviceType === "event_management") {
    const d = request.details as EventManagementDetails | null;
    const label = d?.location?.label;
    if (!label) return null;
    return (
      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden />
        <span className="line-clamp-1">{label}</span>
      </p>
    );
  }
  return null;
}
