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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
    >
      <div className="container mx-auto flex gap-2">
        {onPrimaryAction ? (
          <Button className="min-h-11 flex-1" size="lg" type="button" onClick={onPrimaryAction}>
            {primaryLabel}
          </Button>
        ) : hasPhone ? (
          <Button className="min-h-11 flex-1" size="lg" asChild>
            <a href={buildTelHref(phone!)}>
              <Phone className="size-4" />
              {primaryLabel}
            </a>
          </Button>
        ) : null}
        {hasPhone ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 flex-1 bg-[#25D366] text-white hover:bg-[#20BD5A] hover:text-white"
            onClick={openWhatsApp}
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </Button>
        ) : null}
      </div>
    </div>
  );
}
