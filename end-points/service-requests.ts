import { ApiRequestError, getStoredToken, request } from "@/end-points/http";

export type ServiceType =
  | "packers_movers"
  | "painting_cleaning"
  | "home_services"
  | "event_management";

export type ServiceRequestStatus =
  | "new"
  | "contacted"
  | "scheduled"
  | "completed"
  | "cancelled";

export type PreferredSlot = "morning" | "afternoon" | "evening";

export interface Stop {
  label: string;
  lat: number;
  lng: number;
  placeId?: string | null;
  notes?: string | null;
}

export interface TripEstimate {
  distanceKm: number;
  durationMin: number;
  legs: Array<{ distanceKm: number; durationMin: number }>;
  calculatedAt: string;
}

export interface PackersMoversDetails {
  moveType: "home" | "office" | "vehicle";
  bhk: "1rk" | "1" | "2" | "3" | "4+";
  /** Structured multi-stop representation (preferred). */
  pickup?: Stop;
  drops?: Stop[];
  trip?: TripEstimate;
  /** Legacy plain-text fields kept for rows created before multi-stop support. */
  pickupAddress?: string;
  dropAddress?: string;
  distanceKm?: number | null;
  hasPackingMaterial?: boolean;
  notes?: string | null;
}

export interface PaintingCleaningDetails {
  subType:
    | "full_painting"
    | "partial_painting"
    | "deep_cleaning"
    | "bathroom_cleaning"
    | "sofa_cleaning"
    | "kitchen_cleaning";
  propertyType: "apartment" | "villa" | "office";
  bhkOrSqft: string;
  location?: Stop;
  notes?: string | null;
}

export interface HomeServicesDetails {
  subType: "carpenter" | "plumber" | "electrician";
  propertyType: "apartment" | "villa" | "office";
  bhkOrSqft: string;
  location?: Stop;
  notes?: string | null;
}

export interface EventManagementDetails {
  eventType: "birthday" | "wedding" | "baby_shower" | "corporate";
  venueType: "home" | "banquet" | "hotel" | "outdoor" | "office" | "other";
  guestCount: number;
  budgetRange?: string | null;
  services: Array<
    | "decoration"
    | "catering"
    | "home_catering"
    | "corporate_catering_veg_non_veg"
    | "photography"
    | "music"
    | "hosting"
    | "return_gifts"
    | "venue_booking"
  >;
  location?: Stop;
  themeOrStyle?: string | null;
  notes?: string | null;
}

export interface ServiceRequestTimelineItem {
  id?: number | string;
  title?: string | null;
  milestone?: string | null;
  description?: string | null;
  note?: string | null;
  status?: ServiceRequestStatus | null;
  actorLabel?: string | null;
  timestamp?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ServiceRequestDTO {
  id: number;
  serviceType: ServiceType;
  status: ServiceRequestStatus;
  userId: number | null;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  addressLine: string | null;
  pincode: string | null;
  preferredDate: string | null;
  preferredSlot: PreferredSlot | null;
  details:
    | PackersMoversDetails
    | PaintingCleaningDetails
    | HomeServicesDetails
    | EventManagementDetails
    | null;
  internalNotes: string | null;
  assignedAdminId: number | null;
  assignedVendorUserId: number | null;
  customerRating?: number | null;
  customerFeedback?: string | null;
  customerReviewedAt?: string | null;
  timeline?: ServiceRequestTimelineItem[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaseServiceRequestInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  addressLine?: string;
  pincode?: string;
  preferredDate?: string;
  preferredSlot?: PreferredSlot;
  recaptchaToken?: string;
}

export interface PackersMoversInput extends BaseServiceRequestInput {
  details: PackersMoversDetails;
}

export interface PaintingCleaningInput extends BaseServiceRequestInput {
  details: PaintingCleaningDetails;
}

export interface HomeServicesInput extends BaseServiceRequestInput {
  details: HomeServicesDetails;
}

export interface EventManagementInput extends BaseServiceRequestInput {
  details: EventManagementDetails;
}

export interface ServiceRequestFeedbackInput {
  rating: number;
  feedback?: string;
}

interface StoredServiceRequestFeedback {
  rating: number;
  feedback: string | null;
  reviewedAt: string;
}

const LOCAL_FEEDBACK_STORE_KEY = "fmp:v1:service-request-feedback";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFeedbackInput(input: ServiceRequestFeedbackInput) {
  const rating = Number(input.rating);
  const feedback = input.feedback?.trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Please select a rating from 1 to 5.");
  }
  if (feedback && feedback.length > 1000) {
    throw new Error("Feedback must be 1000 characters or less.");
  }
  return {
    rating,
    feedback: feedback || undefined,
  };
}

function normalizeStoredFeedback(
  value: unknown,
): StoredServiceRequestFeedback | null {
  if (!isRecord(value)) return null;
  const rating = Number(value.rating);
  const reviewedAt =
    typeof value.reviewedAt === "string" ? value.reviewedAt : null;
  const feedback =
    typeof value.feedback === "string"
      ? value.feedback
      : value.feedback === null
        ? null
        : undefined;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !reviewedAt) {
    return null;
  }

  return {
    rating,
    feedback: feedback ?? null,
    reviewedAt,
  };
}

function readStoredFeedback(): Record<string, StoredServiceRequestFeedback> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    if (!isRecord(parsed)) return {};
    return Object.entries(parsed).reduce<
      Record<string, StoredServiceRequestFeedback>
    >((acc, [id, value]) => {
      const normalized = normalizeStoredFeedback(value);
      if (normalized) acc[id] = normalized;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function writeStoredFeedback(
  requestId: number,
  feedback: StoredServiceRequestFeedback,
) {
  if (typeof window === "undefined") return;
  try {
    const current = readStoredFeedback();
    localStorage.setItem(
      LOCAL_FEEDBACK_STORE_KEY,
      JSON.stringify({
        ...current,
        [requestId]: feedback,
      }),
    );
  } catch {
    /* local fallback is best effort */
  }
}

function mergeStoredFeedback(rows: ServiceRequestDTO[]): ServiceRequestDTO[] {
  const stored = readStoredFeedback();
  if (Object.keys(stored).length === 0) return rows;

  return rows.map((row) => {
    const localFeedback = stored[String(row.id)];
    if (!localFeedback || row.customerRating || row.customerReviewedAt) {
      return row;
    }

    return {
      ...row,
      customerRating: localFeedback.rating,
      customerFeedback: localFeedback.feedback,
      customerReviewedAt: localFeedback.reviewedAt,
    };
  });
}

function shouldUseLocalFeedbackFallback(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error.status === 404 || error.status === 405 || error.status === 501;
  }
  return error instanceof TypeError;
}

export interface AdminListServiceRequestsQuery {
  serviceType?: ServiceType;
  status?: ServiceRequestStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface AdminListServiceRequestsResponse {
  items: ServiceRequestDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUpdateServiceRequestInput {
  status?: ServiceRequestStatus;
  internalNotes?: string;
  assignedAdminId?: number | null;
  assignedVendorUserId?: number | null;
  emailNotifications?: {
    enabled: true;
    recipients: Array<"customer" | "vendor" | "admin">;
    events: Array<"status_changed" | "completed" | "vendor_assigned">;
  };
}

export interface ServiceRequestStats {
  byType: Record<ServiceType, Record<ServiceRequestStatus, number>>;
  totals: Record<ServiceType, number>;
  openTotal: number;
}

export interface TripEstimateResponse {
  estimate: TripEstimate | null;
}

function buildQuery(q: AdminListServiceRequestsQuery): string {
  const params = new URLSearchParams();
  if (q.serviceType) params.set("serviceType", q.serviceType);
  if (q.status) params.set("status", q.status);
  if (q.q?.trim()) params.set("q", q.q.trim());
  if (q.page) params.set("page", String(q.page));
  if (q.limit) params.set("limit", String(q.limit));
  const str = params.toString();
  return str ? `?${str}` : "";
}

export const serviceRequests = {
  async submitPackersMovers(input: PackersMoversInput): Promise<ServiceRequestDTO> {
    return request<ServiceRequestDTO>("/service-requests/packers-movers", {
      method: "POST",
      body: JSON.stringify(input),
      token: getStoredToken(),
    });
  },

  async submitPaintingCleaning(input: PaintingCleaningInput): Promise<ServiceRequestDTO> {
    return request<ServiceRequestDTO>("/service-requests/painting-cleaning", {
      method: "POST",
      body: JSON.stringify(input),
      token: getStoredToken(),
    });
  },

  async submitHomeServices(input: HomeServicesInput): Promise<ServiceRequestDTO> {
    return request<ServiceRequestDTO>("/service-requests/home-services", {
      method: "POST",
      body: JSON.stringify(input),
      token: getStoredToken(),
    });
  },

  async submitEventManagement(input: EventManagementInput): Promise<ServiceRequestDTO> {
    return request<ServiceRequestDTO>("/service-requests/event-management", {
      method: "POST",
      body: JSON.stringify(input),
      token: getStoredToken(),
    });
  },

  async getMyServiceRequests(): Promise<ServiceRequestDTO[]> {
    const rows = await request<ServiceRequestDTO[]>("/service-requests/mine", {
      method: "GET",
      token: getStoredToken(),
    });
    return Array.isArray(rows) ? mergeStoredFeedback(rows) : [];
  },

  async submitServiceRequestFeedback(
    id: number,
    input: ServiceRequestFeedbackInput,
  ): Promise<ServiceRequestDTO> {
    const normalized = normalizeFeedbackInput(input);
    const fallbackReviewedAt = new Date().toISOString();

    try {
      const result = await request<ServiceRequestDTO>(
        `/service-requests/${id}/feedback`,
        {
          method: "POST",
          body: JSON.stringify(normalized),
          token: getStoredToken(),
        },
      );
      writeStoredFeedback(id, {
        rating: result.customerRating ?? normalized.rating,
        feedback: result.customerFeedback ?? normalized.feedback ?? null,
        reviewedAt: result.customerReviewedAt ?? fallbackReviewedAt,
      });
      return {
        ...result,
        customerRating: result.customerRating ?? normalized.rating,
        customerFeedback: result.customerFeedback ?? normalized.feedback ?? null,
        customerReviewedAt: result.customerReviewedAt ?? fallbackReviewedAt,
      };
    } catch (error) {
      if (!shouldUseLocalFeedbackFallback(error)) throw error;

      writeStoredFeedback(id, {
        rating: normalized.rating,
        feedback: normalized.feedback ?? null,
        reviewedAt: fallbackReviewedAt,
      });

      return {
        id,
        serviceType: "packers_movers",
        status: "completed",
        userId: null,
        name: "",
        phone: "",
        email: null,
        city: null,
        addressLine: null,
        pincode: null,
        preferredDate: null,
        preferredSlot: null,
        details: null,
        internalNotes: null,
        assignedAdminId: null,
        assignedVendorUserId: null,
        customerRating: normalized.rating,
        customerFeedback: normalized.feedback ?? null,
        customerReviewedAt: fallbackReviewedAt,
        createdAt: fallbackReviewedAt,
        updatedAt: fallbackReviewedAt,
      };
    }
  },

  async adminListServiceRequests(
    query: AdminListServiceRequestsQuery = {},
  ): Promise<AdminListServiceRequestsResponse> {
    return request<AdminListServiceRequestsResponse>(
      `/admin/service-requests${buildQuery(query)}`,
      { method: "GET", token: getStoredToken() },
    );
  },

  async adminGetServiceRequest(id: number): Promise<ServiceRequestDTO> {
    return request<ServiceRequestDTO>(`/admin/service-requests/${id}`, {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async adminUpdateServiceRequest(
    id: number,
    input: AdminUpdateServiceRequestInput,
  ): Promise<ServiceRequestDTO> {
    return request<ServiceRequestDTO>(`/admin/service-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      token: getStoredToken(),
    });
  },

  async adminGetServiceRequestStats(): Promise<ServiceRequestStats> {
    return request<ServiceRequestStats>("/admin/service-requests/stats", {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async getTripEstimate(
    pickup: { lat: number; lng: number },
    drops: Array<{ lat: number; lng: number }>,
  ): Promise<TripEstimateResponse> {
    const params = new URLSearchParams({
      pickup: `${pickup.lat},${pickup.lng}`,
      drops: drops.map((d) => `${d.lat},${d.lng}`).join("|"),
    });
    return request<TripEstimateResponse>(
      `/service-requests/trip-estimate?${params.toString()}`,
      { method: "GET", token: getStoredToken() },
    );
  },
};
