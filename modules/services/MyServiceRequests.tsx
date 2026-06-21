"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flag,
  History,
  Loader2,
  MapPin,
  MessageSquare,
  PaintBucket,
  PartyPopper,
  Phone,
  Route,
  Star,
  Truck,
  Wrench,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/contexts/auth-context";
import {
  useMyServiceRequests,
  useSubmitServiceRequestFeedback,
} from "@/hooks/use-service-requests";
import { cn } from "@/lib/utils";
import type {
  EventManagementDetails,
  PackersMoversDetails,
  PaintingCleaningDetails,
  HomeServicesDetails,
  ServiceRequestDTO,
  ServiceRequestFeedbackInput,
  ServiceRequestStatus,
  ServiceRequestTimelineItem,
  ServiceType,
} from "@/lib/api";

const FEEDBACK_SKIP_KEY = "fmp:v1:service-feedback-skipped";
const RATING_VALUES = [1, 2, 3, 4, 5] as const;

function formatDuration(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return "-";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatRelativeTimestamp(value: string | null | undefined): string {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return formatDistanceToNow(date, { addSuffix: true });
}

function getFeedbackSkipKey(userId: string | null | undefined, requestId: number) {
  return `${FEEDBACK_SKIP_KEY}:${userId ?? "guest"}:${requestId}`;
}

function wasFeedbackSkipped(userId: string | null | undefined, requestId: number) {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(getFeedbackSkipKey(userId, requestId)) === "1";
  } catch {
    return false;
  }
}

function rememberFeedbackSkip(
  userId: string | null | undefined,
  requestId: number,
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getFeedbackSkipKey(userId, requestId), "1");
  } catch {
    /* best effort only */
  }
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
  home_services: {
    label: "Home Services",
    icon: Wrench,
    href: "/home-services",
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

const SUBTYPE_LABELS: Record<PaintingCleaningDetails["subType"], string> = {
  full_painting: "Full home painting",
  partial_painting: "Partial / room painting",
  deep_cleaning: "Deep home cleaning",
  bathroom_cleaning: "Bathroom cleaning",
  sofa_cleaning: "Sofa / upholstery cleaning",
  kitchen_cleaning: "Kitchen deep cleaning",
};

const HOME_SUBTYPE_LABELS: Record<HomeServicesDetails["subType"], string> = {
  carpenter: "Carpenter",
  plumber: "Plumber",
  electrician: "Electrician",
};

const PROPERTY_TYPE_LABELS: Record<
  PaintingCleaningDetails["propertyType"],
  string
> = {
  apartment: "Apartment",
  villa: "Villa / Independent house",
  office: "Office / Shop",
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

const STATUS_TIMELINE_COPY: Record<ServiceRequestStatus, string> = {
  new: "Your request is waiting for review.",
  contacted: "Our team has contacted you about this request.",
  scheduled: "Your service has been scheduled.",
  completed: "The service was marked completed.",
  cancelled: "The service request was cancelled.",
};

interface TimelineViewItem {
  key: string;
  title: string;
  description?: string;
  timestamp: string;
  actorLabel?: string | null;
}

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
    const d = r.details as PaintingCleaningDetails;
    return [
      d.subType ? SUBTYPE_LABELS[d.subType] : null,
      d.propertyType ? PROPERTY_TYPE_LABELS[d.propertyType] : null,
      d.bhkOrSqft ?? null,
    ].filter((x): x is string => Boolean(x));
  }
  if (r.serviceType === "home_services") {
    const d = r.details as HomeServicesDetails;
    return [
      d.subType ? HOME_SUBTYPE_LABELS[d.subType] : null,
      d.propertyType ? PROPERTY_TYPE_LABELS[d.propertyType] : null,
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

function getCustomerRating(request: ServiceRequestDTO): number | null {
  const rating = request.customerRating;
  if (typeof rating !== "number" || !Number.isFinite(rating)) return null;
  return Math.min(5, Math.max(1, Math.round(rating)));
}

function hasCustomerReview(request: ServiceRequestDTO) {
  return getCustomerRating(request) !== null || Boolean(request.customerReviewedAt);
}

function shouldAskForFeedback(
  request: ServiceRequestDTO,
  userId: string | null | undefined,
  skippedRequestIds: Set<number>,
) {
  if (request.status !== "completed") return false;
  if (hasCustomerReview(request)) return false;
  if (skippedRequestIds.has(request.id)) return false;
  return !wasFeedbackSkipped(userId, request.id);
}

function normalizeTimelineItems(
  items: ServiceRequestTimelineItem[] | null | undefined,
): TimelineViewItem[] {
  if (!items?.length) return [];
  return items.flatMap((item, index) => {
    const timestamp = item.timestamp ?? item.createdAt ?? item.updatedAt;
    if (!timestamp) return [];
    const statusLabel = item.status ? STATUS_META[item.status]?.label : null;
    const title =
      item.title ??
      item.milestone ??
      (statusLabel ? `Status: ${statusLabel}` : "Status update");
    return [
      {
        key: String(item.id ?? `${timestamp}-${index}`),
        title,
        description: item.description ?? item.note ?? undefined,
        timestamp,
        actorLabel: item.actorLabel ?? null,
      },
    ];
  });
}

function appendReviewTimelineItem(
  items: TimelineViewItem[],
  request: ServiceRequestDTO,
) {
  if (!request.customerReviewedAt) return items;
  const hasFeedbackItem = items.some((item) =>
    /feedback|review|rating/i.test(item.title),
  );
  if (hasFeedbackItem) return items;
  return [
    ...items,
    {
      key: `review-${request.id}`,
      title: "Feedback submitted",
      description: "You shared your service rating.",
      timestamp: request.customerReviewedAt,
      actorLabel: "Customer",
    },
  ];
}

function buildServiceTimeline(request: ServiceRequestDTO): TimelineViewItem[] {
  const apiItems = normalizeTimelineItems(request.timeline);
  if (apiItems.length > 0) return appendReviewTimelineItem(apiItems, request);

  const items: TimelineViewItem[] = [
    {
      key: `created-${request.id}`,
      title: "Request created",
      description: "Your request was received by our team.",
      timestamp: request.createdAt,
      actorLabel: "Customer",
    },
  ];

  if (request.assignedVendorUserId) {
    items.push({
      key: `vendor-${request.id}`,
      title: "Vendor assigned",
      description: "A service partner has been assigned to this request.",
      timestamp: request.updatedAt,
      actorLabel: "Admin",
    });
  }

  if (request.status !== "new") {
    const status = STATUS_META[request.status] ?? STATUS_META.new;
    items.push({
      key: `status-${request.id}-${request.status}`,
      title: `Status: ${status.label}`,
      description: STATUS_TIMELINE_COPY[request.status],
      timestamp: request.updatedAt,
      actorLabel: "Team",
    });
  }

  return appendReviewTimelineItem(items, request);
}

export default function MyServiceRequests() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useMyServiceRequests();
  const feedbackMutation = useSubmitServiceRequestFeedback();
  const [skippedRequestIds, setSkippedRequestIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [manualFeedbackRequest, setManualFeedbackRequest] =
    useState<ServiceRequestDTO | null>(null);

  const feedbackCandidate = useMemo(() => {
    if (!data?.length) return null;
    return (
      data.find((request) =>
        shouldAskForFeedback(request, user?.id, skippedRequestIds),
      ) ?? null
    );
  }, [data, skippedRequestIds, user?.id]);

  const activeFeedbackRequest = manualFeedbackRequest ?? feedbackCandidate;

  const closeFeedbackPrompt = () => {
    if (!activeFeedbackRequest) return;
    rememberFeedbackSkip(user?.id, activeFeedbackRequest.id);
    setSkippedRequestIds((current) => {
      const next = new Set(current);
      next.add(activeFeedbackRequest.id);
      return next;
    });
    setManualFeedbackRequest(null);
  };

  const submitFeedback = async (input: ServiceRequestFeedbackInput) => {
    if (!activeFeedbackRequest) return;
    await feedbackMutation.mutateAsync({
      id: activeFeedbackRequest.id,
      input,
    });
    rememberFeedbackSkip(user?.id, activeFeedbackRequest.id);
    setSkippedRequestIds((current) => {
      const next = new Set(current);
      next.add(activeFeedbackRequest.id);
      return next;
    });
    setManualFeedbackRequest(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 font-heading text-xl font-bold text-foreground">
          My Service Requests
        </h2>
        <p className="text-sm text-muted-foreground">
          Track your Packers & Movers, Painting & Cleaning, and Event Management
          bookings.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading your requests...</span>
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Could not load your requests
            </p>
            <p className="mt-1 text-muted-foreground">
              {(error as Error)?.message || "Please try again in a moment."}
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
                <Truck data-icon="inline-start" />
                Packers & Movers
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/painting-cleaning">
                <PaintBucket data-icon="inline-start" />
                Painting & Cleaning
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/home-services">
                <Wrench data-icon="inline-start" />
                Home Services
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/event-management">
                <PartyPopper data-icon="inline-start" />
                Event Management
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && data && data.length > 0 ? (
        <div className="grid gap-3">
          {data.map((request, i) => (
            <ServiceRequestCard
              key={request.id}
              request={request}
              index={i}
              onRate={() => setManualFeedbackRequest(request)}
            />
          ))}
        </div>
      ) : null}

      <ServiceFeedbackDialog
        key={activeFeedbackRequest?.id ?? "feedback-closed"}
        request={activeFeedbackRequest}
        open={Boolean(activeFeedbackRequest)}
        isPending={feedbackMutation.isPending}
        onSkip={closeFeedbackPrompt}
        onSubmit={submitFeedback}
      />
    </div>
  );
}

function ServiceRequestCard({
  request,
  index,
  onRate,
}: {
  request: ServiceRequestDTO;
  index: number;
  onRate: () => void;
}) {
  const meta = SERVICE_META[request.serviceType];
  const status = STATUS_META[request.status] ?? STATUS_META.new;
  const summary = detailSummary(request);

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <meta.icon className="size-5 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">
              {meta.label}
            </h3>
            <Badge variant={status.variant} className="text-[10px] uppercase">
              {status.label}
            </Badge>
            <span className="text-xs text-muted-foreground">#{request.id}</span>
          </div>
          {summary.length > 0 ? (
            <p className="mt-0.5 text-xs capitalize text-muted-foreground">
              {summary.join(" · ")}
            </p>
          ) : null}
          <LocationStrip request={request} />
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Phone className="size-3" aria-hidden />
              {request.phone}
            </span>
            {request.city ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" aria-hidden />
                {request.city}
              </span>
            ) : null}
            {request.preferredDate ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" aria-hidden />
                {request.preferredDate}
                {request.preferredSlot ? ` · ${request.preferredSlot}` : ""}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1 sm:items-end">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTimestamp(request.createdAt)}
          </span>
          <Button size="sm" variant="ghost" asChild>
            <Link href={meta.href}>
              Book again
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>

      <CustomerReview request={request} onRate={onRate} />
      <ServiceTimeline request={request} />
    </motion.article>
  );
}

function ServiceFeedbackDialog({
  request,
  open,
  isPending,
  onSkip,
  onSubmit,
}: {
  request: ServiceRequestDTO | null;
  open: boolean;
  isPending: boolean;
  onSkip: () => void;
  onSubmit: (input: ServiceRequestFeedbackInput) => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  if (!request) return null;

  const serviceLabel = SERVICE_META[request.serviceType].label;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) onSkip();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (rating === 0 || isPending) return;
            void onSubmit({
              rating,
              feedback: feedback.trim() || undefined,
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Rate your completed service</DialogTitle>
            <DialogDescription>
              {serviceLabel} request #{request.id}. Feedback is optional.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Rating</p>
            <ToggleGroup
              type="single"
              value={rating ? String(rating) : ""}
              onValueChange={(value) => setRating(value ? Number(value) : 0)}
              className="justify-start"
              aria-label="Service rating"
            >
              {RATING_VALUES.map((value) => (
                <ToggleGroupItem
                  key={value}
                  value={String(value)}
                  aria-label={`Rate ${value} out of 5`}
                  className={cn(
                    "size-10 p-0",
                    value <= rating && "text-primary",
                  )}
                >
                  <Star
                    className={cn("size-5", value <= rating && "fill-current")}
                    aria-hidden
                  />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              Feedback
            </span>
            <Textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              maxLength={1000}
              placeholder="Share what went well, or what we should improve."
              rows={4}
            />
          </label>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={onSkip}
            >
              Skip
            </Button>
            <Button type="submit" disabled={rating === 0 || isPending}>
              {isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : null}
              Submit rating
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerReview({
  request,
  onRate,
}: {
  request: ServiceRequestDTO;
  onRate: () => void;
}) {
  if (request.status !== "completed") return null;

  const rating = getCustomerRating(request);
  const feedback = request.customerFeedback?.trim();

  if (rating) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquare className="size-4 text-primary" aria-hidden />
            Your feedback
          </div>
          <StarRatingValue rating={rating} />
        </div>
        {feedback ? (
          <p className="text-sm text-muted-foreground">{feedback}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No written feedback added.
          </p>
        )}
        {request.customerReviewedAt ? (
          <p className="text-xs text-muted-foreground">
            Submitted {formatRelativeTimestamp(request.customerReviewedAt)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">
          How was this completed service?
        </p>
        <p className="text-xs text-muted-foreground">
          Add a rating now, or skip the popup and come back later.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onRate}>
        <Star data-icon="inline-start" />
        Rate service
      </Button>
    </div>
  );
}

function StarRatingValue({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1 text-primary"
      aria-label={`${rating} out of 5 stars`}
    >
      {RATING_VALUES.map((value) => (
        <Star
          key={value}
          className={cn("size-4", value <= rating && "fill-current")}
          aria-hidden
        />
      ))}
    </div>
  );
}

function ServiceTimeline({ request }: { request: ServiceRequestDTO }) {
  const items = buildServiceTimeline(request);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        <History className="size-3.5" aria-hidden />
        Timeline
      </div>
      <ol className="flex flex-col gap-3">
        {items.map((item, index) => (
          <TimelineRow
            key={item.key}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}

function TimelineRow({
  item,
  isLast,
}: {
  item: TimelineViewItem;
  isLast: boolean;
}) {
  return (
    <li className="grid grid-cols-[1rem_1fr] gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "mt-0.5 flex size-4 items-center justify-center rounded-full border",
            isLast
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground",
          )}
        >
          {isLast ? (
            <CheckCircle2 className="size-3" aria-hidden />
          ) : (
            <span className="size-1.5 rounded-full bg-current" />
          )}
        </span>
        {!isLast ? <span className="mt-1 min-h-8 w-px flex-1 bg-border" /> : null}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          {item.actorLabel ? (
            <Badge variant="outline" className="text-[10px]">
              {item.actorLabel}
            </Badge>
          ) : null}
        </div>
        {item.description ? (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {formatRelativeTimestamp(item.timestamp)}
        </p>
      </div>
    </li>
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
      <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
        {pickup ? (
          <p className="flex items-start gap-1.5">
            <MapPin
              className="mt-0.5 size-3 shrink-0 text-primary"
              aria-hidden
            />
            <span className="line-clamp-1">{pickup}</span>
          </p>
        ) : null}
        {drops.map((label, i) => (
          <p key={`${label}-${i}`} className="flex items-start gap-1.5">
            <Flag className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
            <span className="line-clamp-1">
              {drops.length > 1 ? `Drop ${i + 1}: ` : ""}
              {label}
            </span>
          </p>
        ))}
        {d.trip ? (
          <p className="flex items-center gap-3 pt-0.5 text-foreground/80">
            <span className="inline-flex items-center gap-1">
              <Route className="size-3" aria-hidden />
              {d.trip.distanceKm.toFixed(1)} km
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {formatDuration(d.trip.durationMin)}
            </span>
          </p>
        ) : null}
      </div>
    );
  }
  if (
    request.serviceType === "painting_cleaning" ||
    request.serviceType === "home_services"
  ) {
    const d = request.details as
      | PaintingCleaningDetails
      | HomeServicesDetails
      | null;
    const label = d?.location?.label;
    if (!label) return null;
    return (
      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
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
        <MapPin className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
        <span className="line-clamp-1">{label}</span>
      </p>
    );
  }
  return null;
}
