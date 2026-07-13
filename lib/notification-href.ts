import type { UserRole } from "@/end-points/types";
import type { Notification } from "@/schema/notification";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeKey(raw: string | null): string | null {
  if (!raw) return null;
  return raw.toLowerCase().replace(/[\s-]+/g, "_");
}

function vendorLeadHref(
  role: UserRole | undefined,
  id: number | null,
): string | null {
  if (role === "admin") return "/admin/vendor-leads";
  if (role === "vendor") return id != null ? `/leads/${id}` : "/leads";
  return null;
}

function serviceRequestHref(role: UserRole | undefined): string | null {
  if (role === "admin") return "/admin/service-requests";
  // Customers track their own submissions here
  if (role === "tenant" || role === "agent") return "/my-requests";
  // Vendors never open admin service requests; jobs live under leads
  if (role === "vendor") return "/leads";
  return null;
}

function vendorKycHref(role: UserRole | undefined): string | null {
  if (role === "admin") return "/admin/vendors";
  if (role === "vendor") return "/profile";
  return null;
}

function supportHref(role: UserRole | undefined): string | null {
  if (role === "admin") return "/admin/complaints";
  if (role === "vendor") return "/support";
  return null;
}

function walletHref(role: UserRole | undefined): string | null {
  if (role === "admin") return "/admin/payments";
  if (role === "vendor") return "/wallet";
  return null;
}

function propertyHref(role: UserRole | undefined): string | null {
  if (role === "admin") return "/approvals";
  if (role === "agent" || role === "tenant") return "/listings";
  return null;
}

/**
 * Role-aware destination for an in-app notification action link.
 * Never send non-admins to `/admin/*` routes.
 */
export function getNotificationHref(
  notification: Notification,
  role: UserRole | undefined,
): string | null {
  const meta =
    notification.metadata &&
    typeof notification.metadata === "object" &&
    !Array.isArray(notification.metadata)
      ? (notification.metadata as Record<string, unknown>)
      : null;

  const title = notification.title ?? "";
  const body = notification.body ?? "";
  const haystack = `${title}\n${body}`.toLowerCase();
  const type = (notification.type ?? "").toLowerCase();

  const entityType = normalizeKey(
    asString(meta?.entityType) ??
      asString(meta?.entity_type) ??
      asString(meta?.resourceType) ??
      asString(meta?.resource_type) ??
      asString(meta?.kind),
  );

  const entityId = asNumber(meta?.entityId ?? meta?.entity_id);

  const vendorLeadId = asNumber(
    meta?.vendorLeadId ??
      meta?.vendor_lead_id ??
      meta?.leadId ??
      meta?.lead_id ??
      (entityType === "vendor_lead" || entityType === "lead" ? entityId : null),
  );

  // Do NOT fall back to generic entityId as serviceRequestId — that misroutes
  // vendor leads / KYC / tickets to the service-requests admin page.
  const serviceRequestId = asNumber(
    meta?.serviceRequestId ??
      meta?.service_request_id ??
      meta?.requestId ??
      meta?.request_id ??
      (entityType === "service_request" || entityType === "service"
        ? entityId
        : null),
  );

  const ticketId = asNumber(
    meta?.ticketId ??
      meta?.ticket_id ??
      meta?.supportTicketId ??
      meta?.support_ticket_id ??
      (entityType === "support_ticket" ||
      entityType === "ticket" ||
      entityType === "complaint"
        ? entityId
        : null),
  );

  // --- Explicit entity type ---
  if (entityType === "vendor_lead" || entityType === "lead") {
    return vendorLeadHref(role, vendorLeadId ?? entityId);
  }
  if (entityType === "service_request" || entityType === "service") {
    return serviceRequestHref(role);
  }
  if (
    entityType === "vendor" ||
    entityType === "vendor_profile" ||
    entityType === "vendor_kyc" ||
    entityType === "kyc"
  ) {
    return vendorKycHref(role);
  }
  if (
    entityType === "support_ticket" ||
    entityType === "ticket" ||
    entityType === "complaint"
  ) {
    return supportHref(role);
  }
  if (entityType === "property" || entityType === "listing") {
    return propertyHref(role);
  }
  if (entityType === "email_log" || entityType === "email") {
    return role === "admin" ? "/admin/email-logs" : null;
  }
  if (
    entityType === "wallet" ||
    entityType === "payout" ||
    entityType === "payment"
  ) {
    return walletHref(role);
  }

  // --- Explicit ids (safe keys only) ---
  if (vendorLeadId != null) return vendorLeadHref(role, vendorLeadId);
  if (serviceRequestId != null) return serviceRequestHref(role);
  if (ticketId != null) return supportHref(role);

  // --- Notification type ---
  if (
    type === "vendor_payout" ||
    type.includes("payout") ||
    type.includes("wallet")
  ) {
    return walletHref(role);
  }
  if (type === "property_lead_new") {
    if (role === "agent" || role === "admin") return "/leads";
    return null;
  }
  if (type.includes("support") || type.includes("ticket")) {
    return supportHref(role);
  }

  // --- Infer from title/body (common for email_received mirrors) ---
  // Vendor lead before generic "vendor"
  if (
    haystack.includes("vendor lead") ||
    haystack.includes("awaiting approval") ||
    haystack.includes("pending admin review") ||
    haystack.includes("lead assigned") ||
    haystack.includes("lead approved") ||
    haystack.includes("lead rejected") ||
    (haystack.includes("lead") && haystack.includes("approval"))
  ) {
    return vendorLeadHref(role, vendorLeadId);
  }

  if (
    haystack.includes("kyc") ||
    haystack.includes("verification") ||
    (haystack.includes("vendor") &&
      haystack.includes("pending") &&
      !haystack.includes("lead") &&
      !haystack.includes("service request"))
  ) {
    return vendorKycHref(role);
  }

  if (
    haystack.includes("service request") ||
    haystack.includes("packers") ||
    haystack.includes("painting") ||
    haystack.includes("home services") ||
    haystack.includes("it services") ||
    haystack.includes("general services") ||
    haystack.includes("event management")
  ) {
    return serviceRequestHref(role);
  }

  if (
    haystack.includes("support ticket") ||
    haystack.includes("new support") ||
    haystack.includes("complaint")
  ) {
    return supportHref(role);
  }

  if (
    haystack.includes("payout") ||
    haystack.includes("wallet") ||
    haystack.includes("payment link")
  ) {
    return walletHref(role);
  }

  // Last resort for admin email mirrors
  if (type === "email_received" && role === "admin") {
    return "/admin/email-logs";
  }

  return null;
}
