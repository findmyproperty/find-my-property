"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isValid, parseISO, startOfDay } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
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
  PhoneCall,
  Route,
  Star,
  Truck,
  Wrench,
  Monitor,
  HandHelping,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { useAuth } from "@/contexts/auth-context";
import { useMyServiceRequests } from "@/hooks/use-service-requests";
import { useSupportTelContact } from "@/hooks/use-support-tel-contact";
import { useToast } from "@/hooks/use-toast";
import {
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls";
import { SERVICE_REQUEST_STATUS_OPTIONS } from "@/lib/admin/status-config";
import { cn } from "@/lib/utils";
import {
  api,
  type EventManagementDetails,
  type PackersMoversDetails,
  type PaintingCleaningDetails,
  type HomeServicesDetails,
  type ItServicesDetails,
  type GeneralServicesDetails,
  type ServiceRequestDTO,
  type ServiceRequestFeedbackInput,
  type ServiceRequestStatus,
  type ServiceRequestTimelineItem,
  type ServiceType,
} from "@/lib/api";

const FEEDBACK_SKIP_KEY = "fmp:v1:service-feedback-skipped";
const RATING_VALUES = [1, 2, 3, 4, 5] as const;
const PAGE_SIZE = 8;
const ALL_FILTER = "all";

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
  it: {
    label: "IT Services",
    icon: Monitor,
    href: "/it-services",
  },
  general: {
    label: "General Services",
    icon: HandHelping,
    href: "/general-services",
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

const IT_SUBTYPE_LABELS: Record<string, string> = {
  web_design: "Web design",
  server_tech: "Server tech",
  networking: "Networking / Wi-Fi",
  software_installation: "Software installation",
  cctv_setup: "CCTV setup",
  printer_setup: "Printer setup",
};

const GENERAL_SUBTYPE_LABELS: Record<string, string> = {
  handyman: "Handyman",
  errands: "Errands & assistance",
  furniture_assembly: "Furniture assembly",
  other: "Other general help",
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
      d.subType ? HOME_SUBTYPE_LABELS[d.subType] ?? d.subType : null,
      d.propertyType ? PROPERTY_TYPE_LABELS[d.propertyType] : null,
      d.bhkOrSqft ?? null,
    ].filter((x): x is string => Boolean(x));
  }
  if (r.serviceType === "it") {
    const d = r.details as ItServicesDetails;
    return [
      d.subType ? IT_SUBTYPE_LABELS[d.subType] ?? d.subType : null,
      d.notes?.trim() ? d.notes.trim().slice(0, 80) : null,
    ].filter((x): x is string => Boolean(x));
  }
  if (r.serviceType === "general") {
    const d = r.details as GeneralServicesDetails;
    return [
      d.subType ? GENERAL_SUBTYPE_LABELS[d.subType] ?? d.subType : null,
      d.notes?.trim() ? d.notes.trim().slice(0, 80) : null,
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

function requestSearchText(request: ServiceRequestDTO): string {
  const meta = SERVICE_META[request.serviceType];
  return [
    String(request.id),
    meta?.label,
    request.serviceType,
    request.status,
    STATUS_META[request.status]?.label,
    request.city,
    request.phone,
    request.addressLine,
    request.preferredDate,
    ...detailSummary(request),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function parseRequestDay(value: string | null | undefined): Date | null {
  if (!value) return null;
  const iso = parseISO(value.length <= 10 ? `${value}T00:00:00` : value);
  if (isValid(iso)) return startOfDay(iso);
  const fallback = new Date(value);
  return isValid(fallback) ? startOfDay(fallback) : null;
}

function matchesDateRange(
  request: ServiceRequestDTO,
  from: string,
  to: string,
): boolean {
  if (!from && !to) return true;
  const day =
    parseRequestDay(request.preferredDate) ??
    parseRequestDay(request.createdAt);
  if (!day) return false;
  if (from) {
    const fromDay = parseRequestDay(from);
    if (fromDay && day < fromDay) return false;
  }
  if (to) {
    const toDay = parseRequestDay(to);
    if (toDay && day > toDay) return false;
  }
  return true;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useMyServiceRequests();
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [skippedRequestIds, setSkippedRequestIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackQueue, setFeedbackQueue] = useState<ServiceRequestDTO[]>([]);
  const [feedbackStartId, setFeedbackStartId] = useState<number | null>(null);
  const [autoPrompted, setAutoPrompted] = useState(false);

  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [serviceFilter, setServiceFilter] = useState(ALL_FILTER);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    filterSheetOpen,
    setFilterSheetOpen,
  } = useAdminListControls<"createdAt">({
    defaultSort: { key: "createdAt", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [statusFilter, serviceFilter, dateFrom, dateTo],
  });

  const allRequests = data ?? [];

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    for (const request of allRequests) {
      counts[request.status] = (counts[request.status] ?? 0) + 1;
    }
    return counts;
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return allRequests.filter((request) => {
      if (statusFilter !== ALL_FILTER && request.status !== statusFilter) {
        return false;
      }
      if (
        serviceFilter !== ALL_FILTER &&
        request.serviceType !== serviceFilter
      ) {
        return false;
      }
      if (!matchesDateRange(request, dateFrom, dateTo)) return false;
      if (q && !requestSearchText(request).includes(q)) return false;
      return true;
    });
  }, [
    allRequests,
    statusFilter,
    serviceFilter,
    dateFrom,
    dateTo,
    debouncedSearch,
  ]);

  const paged = useMemo(
    () => paginateItems(filteredRequests, page, PAGE_SIZE),
    [filteredRequests, page],
  );

  const hasActiveFilters =
    statusFilter !== ALL_FILTER ||
    serviceFilter !== ALL_FILTER ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(search.trim());

  const clearFilters = () => {
    setStatusFilter(ALL_FILTER);
    setServiceFilter(ALL_FILTER);
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  const pendingFeedbackRequests = useMemo(() => {
    if (!allRequests.length) return [];
    return allRequests.filter((request) =>
      shouldAskForFeedback(request, user?.id, skippedRequestIds),
    );
  }, [allRequests, skippedRequestIds, user?.id]);

  useEffect(() => {
    if (pendingFeedbackRequests.length === 0) {
      setAutoPrompted(false);
      return;
    }
    if (autoPrompted || feedbackOpen) return;
    setFeedbackQueue(pendingFeedbackRequests);
    setFeedbackStartId(pendingFeedbackRequests[0]?.id ?? null);
    setFeedbackOpen(true);
    setAutoPrompted(true);
  }, [pendingFeedbackRequests, autoPrompted, feedbackOpen]);

  const markRequestHandled = (requestId: number) => {
    rememberFeedbackSkip(user?.id, requestId);
    setSkippedRequestIds((current) => {
      const next = new Set(current);
      next.add(requestId);
      return next;
    });
  };

  const openFeedbackWizard = (
    requests: ServiceRequestDTO[],
    startId?: number,
  ) => {
    if (requests.length === 0) return;
    setFeedbackQueue(requests);
    setFeedbackStartId(startId ?? requests[0].id);
    setFeedbackOpen(true);
  };

  const handleRateClick = (request: ServiceRequestDTO) => {
    const pendingIds = new Set(pendingFeedbackRequests.map((item) => item.id));
    const queue = pendingIds.has(request.id)
      ? pendingFeedbackRequests
      : [
          request,
          ...pendingFeedbackRequests.filter((item) => item.id !== request.id),
        ];
    openFeedbackWizard(queue, request.id);
  };

  const handleSkipRequest = (requestId: number) => {
    markRequestHandled(requestId);
  };

  const handleSkipRemaining = (requestIds: number[]) => {
    for (const id of requestIds) markRequestHandled(id);
    setFeedbackOpen(false);
    setFeedbackQueue([]);
  };

  const handleSubmitRatings = async (
    entries: Array<{ id: number; input: ServiceRequestFeedbackInput }>,
  ) => {
    setIsSubmittingFeedback(true);
    try {
      for (const entry of entries) {
        await api.submitServiceRequestFeedback(entry.id, entry.input);
        markRequestHandled(entry.id);
      }
      await queryClient.invalidateQueries({
        queryKey: ["service-requests", "mine"],
      });
      toast({
        title: "Thanks for your feedback",
        description:
          entries.length === 1
            ? "Your rating has been added to this service request."
            : `${entries.length} ratings saved.`,
      });
      setFeedbackOpen(false);
      setFeedbackQueue([]);
    } catch (error) {
      toast({
        title: "Could not save feedback",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
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
            <Button asChild size="sm" variant="outline">
              <Link href="/it-services">
                <Monitor data-icon="inline-start" />
                IT Services
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/general-services">
                <HandHelping data-icon="inline-start" />
                General Services
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && data && data.length > 0 ? (
        <div className="space-y-4">
          <AdminToolbar
            statusFilter={{
              value: statusFilter,
              onChange: setStatusFilter,
              options: SERVICE_REQUEST_STATUS_OPTIONS,
              counts: statusCounts,
              totalCount: allRequests.length,
              label: "Status",
            }}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search by ID, service, city, phone…",
            }}
            filterSheet={{
              open: filterSheetOpen,
              onOpenChange: setFilterSheetOpen,
              title: "Filter requests",
              description: "Narrow by service type and date range.",
              hasActiveFilters:
                serviceFilter !== ALL_FILTER ||
                Boolean(dateFrom) ||
                Boolean(dateTo),
              onClear: () => {
                setServiceFilter(ALL_FILTER);
                setDateFrom("");
                setDateTo("");
              },
              children: (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="my-req-service">Service type</Label>
                    <Select
                      value={serviceFilter}
                      onValueChange={setServiceFilter}
                    >
                      <SelectTrigger id="my-req-service">
                        <SelectValue placeholder="All services" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_FILTER}>All services</SelectItem>
                        {(
                          Object.entries(SERVICE_META) as Array<
                            [ServiceType, (typeof SERVICE_META)[ServiceType]]
                          >
                        ).map(([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>From date</Label>
                      <DatePicker
                        value={dateFrom}
                        onValueChange={setDateFrom}
                        placeholder="Start date"
                        maxDate={dateTo ? parseRequestDay(dateTo) ?? undefined : undefined}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>To date</Label>
                      <DatePicker
                        value={dateTo}
                        onValueChange={setDateTo}
                        placeholder="End date"
                        minDate={dateFrom ? parseRequestDay(dateFrom) ?? undefined : undefined}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Date filter uses preferred service date when available,
                    otherwise the request created date.
                  </p>
                </div>
              ),
            }}
          />

          {filteredRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
              <p className="font-medium text-foreground">
                No requests match your filters
              </p>
              <p className="mt-1 text-sm">
                Try another status, clear the date range, or search with a different term.
              </p>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Showing {paged.items.length} of {paged.total} request
                {paged.total === 1 ? "" : "s"}
                {hasActiveFilters ? " (filtered)" : ""}
              </p>
              <div className="grid gap-3">
                {paged.items.map((request, i) => (
                  <ServiceRequestCard
                    key={request.id}
                    request={request}
                    index={i}
                    onRate={() => handleRateClick(request)}
                  />
                ))}
              </div>
              <AdminPagination
                page={paged.page}
                totalPages={paged.totalPages}
                total={paged.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      ) : null}

      <ServiceFeedbackDialog
        requests={feedbackQueue}
        open={feedbackOpen && feedbackQueue.length > 0}
        startRequestId={feedbackStartId}
        isPending={isSubmittingFeedback}
        onSkipCurrent={handleSkipRequest}
        onDismissRemaining={handleSkipRemaining}
        onSubmitAll={handleSubmitRatings}
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
          {request.assignedVendorUserId != null ? (
            <PlatformContactButton />
          ) : null}
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

/** Opens the device dialer to Admin Settings → Support phone (not the vendor’s private number). */
function PlatformContactButton() {
  const { canCall, telHref, disabledReason } = useSupportTelContact();

  if (canCall && telHref) {
    return (
      <Button size="sm" variant="secondary" asChild>
        <a href={telHref}>
          <PhoneCall data-icon="inline-start" />
          Contact
        </a>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled
      title={disabledReason ?? undefined}
    >
      <PhoneCall data-icon="inline-start" />
      Contact
    </Button>
  );
}

type FeedbackDraft = {
  rating: number;
  feedback: string;
};

function ServiceFeedbackDialog({
  requests,
  open,
  startRequestId,
  isPending,
  onSkipCurrent,
  onDismissRemaining,
  onSubmitAll,
}: {
  requests: ServiceRequestDTO[];
  open: boolean;
  startRequestId: number | null;
  isPending: boolean;
  onSkipCurrent: (requestId: number) => void;
  onDismissRemaining: (requestIds: number[]) => void;
  onSubmitAll: (
    entries: Array<{ id: number; input: ServiceRequestFeedbackInput }>,
  ) => void | Promise<void>;
}) {
  const [queue, setQueue] = useState<ServiceRequestDTO[]>([]);
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, FeedbackDraft>>({});

  useEffect(() => {
    if (!open) return;
    setQueue(requests);
    const startIdx = startRequestId
      ? Math.max(
          0,
          requests.findIndex((request) => request.id === startRequestId),
        )
      : 0;
    setIndex(startIdx >= 0 ? startIdx : 0);
    setDrafts((current) => {
      const next: Record<number, FeedbackDraft> = {};
      for (const request of requests) {
        next[request.id] = current[request.id] ?? { rating: 0, feedback: "" };
      }
      return next;
    });
  }, [open, requests, startRequestId]);

  if (!open || queue.length === 0) return null;

  const safeIndex = Math.min(index, queue.length - 1);
  const current = queue[safeIndex];
  if (!current) return null;

  const draft = drafts[current.id] ?? { rating: 0, feedback: "" };
  const isLast = safeIndex >= queue.length - 1;
  const isFirst = safeIndex <= 0;
  const serviceMeta = SERVICE_META[current.serviceType];
  const summary = detailSummary(current);
  const ServiceIcon = serviceMeta.icon;

  const updateDraft = (patch: Partial<FeedbackDraft>) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [current.id]: {
        ...(currentDrafts[current.id] ?? { rating: 0, feedback: "" }),
        ...patch,
      },
    }));
  };

  const skipCurrent = () => {
    if (isPending) return;
    const remaining = queue.filter((request) => request.id !== current.id);
    onSkipCurrent(current.id);
    if (remaining.length === 0) {
      onDismissRemaining([]);
      return;
    }
    setQueue(remaining);
    setIndex((prev) => Math.min(prev, remaining.length - 1));
  };

  const goNext = () => {
    if (draft.rating === 0 || isPending || isLast) return;
    setIndex((prev) => Math.min(prev + 1, queue.length - 1));
  };

  const goBack = () => {
    if (isPending || isFirst) return;
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  const submitAll = async () => {
    if (draft.rating === 0 || isPending) return;
    const latestDrafts = {
      ...drafts,
      [current.id]: draft,
    };
    const entries = queue.flatMap((request) => {
      const item = latestDrafts[request.id];
      if (!item || item.rating < 1) return [];
      return [
        {
          id: request.id,
          input: {
            rating: item.rating,
            feedback: item.feedback.trim() || undefined,
          },
        },
      ];
    });
    if (entries.length === 0) return;
    void onSubmitAll(entries);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) {
          onDismissRemaining(queue.map((request) => request.id));
        }
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="relative border-b border-border px-6 pb-4 pt-6 pr-24">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-12 top-4 z-10"
            disabled={isPending}
            onClick={skipCurrent}
          >
            Skip
          </Button>
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="font-heading">
              Rate your completed services
            </DialogTitle>
            <DialogDescription>
              {queue.length === 1
                ? "Share how this service went."
                : `Review ${queue.length} completed requests · ${safeIndex + 1} of ${queue.length}`}
            </DialogDescription>
          </DialogHeader>
          {queue.length > 1 ? (
            <div className="mt-3 flex gap-1.5">
              {queue.map((request, step) => (
                <span
                  key={request.id}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    step <= safeIndex ? "bg-primary" : "bg-muted",
                  )}
                  aria-hidden
                />
              ))}
            </div>
          ) : null}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-5 px-6 py-5"
          >
            <div className="rounded-xl border border-border bg-muted/25 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <ServiceIcon className="size-5 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-sm font-semibold text-foreground">
                      {serviceMeta.label}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      #{current.id}
                    </span>
                  </div>
                  {summary.length > 0 ? (
                    <p className="mt-1 text-sm capitalize text-muted-foreground">
                      {summary.join(" · ")}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {current.city ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {current.city}
                      </span>
                    ) : null}
                    {current.preferredDate ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {format(new Date(current.preferredDate), "MMM d, yyyy")}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden />
                      Completed {formatRelativeTimestamp(current.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Your rating</p>
              <ToggleGroup
                type="single"
                value={draft.rating ? String(draft.rating) : ""}
                onValueChange={(value) =>
                  updateDraft({ rating: value ? Number(value) : 0 })
                }
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
                      value <= draft.rating && "text-primary",
                    )}
                  >
                    <Star
                      className={cn(
                        "size-5",
                        value <= draft.rating && "fill-current",
                      )}
                      aria-hidden
                    />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">
                Feedback{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </span>
              <Textarea
                value={draft.feedback}
                onChange={(event) =>
                  updateDraft({ feedback: event.target.value })
                }
                maxLength={1000}
                placeholder="What went well, or what we should improve?"
                rows={3}
              />
            </label>
          </motion.div>
        </AnimatePresence>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={isFirst || isPending}
            onClick={goBack}
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
          {isLast ? (
            <Button
              type="button"
              disabled={draft.rating === 0 || isPending}
              onClick={() => void submitAll()}
            >
              {isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <CheckCircle2 data-icon="inline-start" />
              )}
              Submit
            </Button>
          ) : (
            <Button
              type="button"
              disabled={draft.rating === 0 || isPending}
              onClick={goNext}
            >
              Next
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </DialogFooter>
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
          Add a rating now, or open the review flow later from this card.
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
