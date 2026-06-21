/**
 * Public API entry — re-exports the composed client from `end-points/`.
 * Import from here (`@/lib/api`) so call sites stay stable.
 */
export type { UserRole, AuthUser } from "@/end-points/types";
export type { SystemLog } from "@/schema/system-log";
export type { Settings } from "@/schema/setting";
export type { Agent } from "@/schema/agent";
export type { Lead, LeadStatus } from "@/schema/lead";
export type { AdminDashboardStats } from "@/schema/admin-dashboard-stats";
export type {
  ServiceType,
  ServiceRequestStatus,
  PreferredSlot,
  Stop,
  TripEstimate,
  TripEstimateResponse,
  PackersMoversDetails,
  PaintingCleaningDetails,
  HomeServicesDetails,
  EventManagementDetails,
  ServiceRequestDTO,
  ServiceRequestFeedbackInput,
  ServiceRequestTimelineItem,
  PackersMoversInput,
  PaintingCleaningInput,
  HomeServicesInput,
  EventManagementInput,
  AdminListServiceRequestsQuery,
  AdminListServiceRequestsResponse,
  AdminUpdateServiceRequestInput,
  ServiceRequestStats,
} from "@/end-points/service-requests";
export type {
  JobConsultancyType,
  JobConsultancyStatus,
  JobConsultancyDetails,
  JobConsultancyDTO,
  JobConsultancyInput,
  AdminListJobConsultancyQuery,
  AdminUpdateJobConsultancyInput,
  JobConsultancyStats,
} from "@/end-points/job-consultancy";
export type {
  LoanType,
  LoanRequestStatus,
  LoanRequestDetails,
  LoanRequestDTO,
  LoanRequestInput,
  AdminListLoanRequestsQuery,
  AdminUpdateLoanRequestInput,
  LoanRequestStats,
} from "@/end-points/loan-requests";
export type {
  AdminListUsersQuery,
  AdminListUsersResponse,
  AdminUserListItem,
} from "@/end-points/user";
export type {
  AdminListPropertiesQuery,
  AdminPropertyStatsQuery,
  AdminListPropertiesResponse,
  AdminPropertyStats,
} from "@/end-points/properties";

export { api, type Api } from "@/end-points";
