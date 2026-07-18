"use client";

import { useSettings } from "@/contexts/settings-context";
import { buildTelHref } from "@/lib/contact-links";

/**
 * Platform contact number from Admin → Settings → Support phone.
 * Vendor/tenant Call buttons dial this number (not each other's private phones).
 */
export function useSupportTelContact() {
  const { settings, isLoading } = useSettings();
  const phone = settings?.supportPhone?.trim() || null;
  const telHref = phone ? buildTelHref(phone) : null;
  const canCall = Boolean(telHref && telHref !== "#");

  return {
    phone,
    telHref: canCall ? telHref : null,
    canCall,
    isLoading,
    disabledReason: canCall
      ? null
      : ("Contact number not configured" as const),
  };
}
