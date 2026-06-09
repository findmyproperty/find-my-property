import { getStoredToken, request } from "@/end-points/http";

export type ServiceType = "packers_movers" | "painting_cleaning";

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
  details: PackersMoversDetails | PaintingCleaningDetails | null;
  internalNotes: string | null;
  assignedAdminId: number | null;
  assignedVendorUserId: number | null;
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

  async getMyServiceRequests(): Promise<ServiceRequestDTO[]> {
    const rows = await request<ServiceRequestDTO[]>("/service-requests/mine", {
      method: "GET",
      token: getStoredToken(),
    });
    return Array.isArray(rows) ? rows : [];
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
