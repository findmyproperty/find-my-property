"use client";

import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildTelHref, buildWhatsAppHref } from "@/lib/contact-links";

type PropertyMobileContactBarProps = {
  title: string;
  propertyId: string;
  phone?: string | null;
  /** Agent flow: primary opens enquiry instead of tel */
  onPrimaryAction?: () => void;
  primaryLabel?: string;
};

/**
 * Fixed mobile CTA dock. Keep it to two equal actions only —
 * rent already lives in the hero / price strip (avoids overflow + clutter).
 */
export function PropertyMobileContactBar({
  title,
  propertyId,
  phone,
  onPrimaryAction,
  primaryLabel = "Contact",
}: PropertyMobileContactBarProps) {
  const hasPhone = Boolean(phone?.trim());

  const openWhatsApp = () => {
    if (!phone) return;
    const text = `Hi, I'm interested in "${title}" (Ref #${propertyId}).`;
    window.open(buildWhatsAppHref(phone, text), "_blank", "noopener,noreferrer");
  };

  if (!hasPhone && !onPrimaryAction) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto flex w-full max-w-lg gap-2 px-3 pt-2.5">
        {onPrimaryAction ? (
          <Button className="h-11 min-h-11 min-w-0 flex-1" size="lg" type="button" onClick={onPrimaryAction}>
            {primaryLabel}
          </Button>
        ) : hasPhone ? (
          <Button className="h-11 min-h-11 min-w-0 flex-1" size="lg" asChild>
            <a href={buildTelHref(phone!)}>
              <Phone className="size-4 shrink-0" />
              <span className="truncate">{primaryLabel}</span>
            </a>
          </Button>
        ) : null}
        {hasPhone ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 min-h-11 min-w-0 flex-1 border-transparent bg-[#25D366] text-white hover:bg-[#20BD5A] hover:text-white"
            onClick={openWhatsApp}
          >
            <MessageCircle className="size-4 shrink-0" />
            <span className="truncate">WhatsApp</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
