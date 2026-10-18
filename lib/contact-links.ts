import { normalizePhone } from "@/helpers";

/** Return a valid international-format number, assuming Indian numbers when no country code is supplied. */
export function normalizeContactPhone(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;

  const value = raw.trim();
  const digits = value.replace(/\D/g, "");

  if (value.startsWith("+")) {
    return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (value.startsWith("00")) {
    const internationalDigits = digits.slice(2);
    return internationalDigits.length >= 7 && internationalDigits.length <= 15
      ? `+${internationalDigits}`
      : null;
  }
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;

  return null;
}

/** Digits only, international (e.g. 919876543210) for wa.me / web.whatsapp.com */
export function toWhatsAppDigits(raw: string): string {
  return normalizePhone(raw).replace(/\D/g, "");
}

/** Opens the device dialer with the number. */
export function buildTelHref(raw: string): string {
  const n = normalizePhone(raw).trim();
  if (!n) return "#";
  return `tel:${n.replace(/\s/g, "")}`;
}

/**
 * WhatsApp chat URL: on phones/tablets uses `wa.me` (app or browser);
 * on desktop/laptop uses `web.whatsapp.com/send` so the web client opens with the chat prefilled.
 */
export function buildWhatsAppHref(raw: string, body?: string): string {
  const digits = toWhatsAppDigits(raw);
  if (!digits) return "#";

  if (typeof window === "undefined") {
    const q = body ? `?text=${encodeURIComponent(body)}` : "";
    return `https://wa.me/${digits}${q}`;
  }

  const ua = navigator.userAgent;
  const isMobileOrTablet =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Macintosh|Windows/i.test(ua));

  if (isMobileOrTablet) {
    const params = new URLSearchParams();
    if (body) params.set("text", body);
    const q = params.toString();
    return `https://wa.me/${digits}${q ? `?${q}` : ""}`;
  }

  const params = new URLSearchParams();
  params.set("phone", digits);
  if (body) params.set("text", body);
  return `https://web.whatsapp.com/send?${params.toString()}`;
}
