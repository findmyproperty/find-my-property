"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Property } from "@/components/property/PropertyCard";
import { buildTelHref, buildWhatsAppHref } from "@/lib/contact-links";

type OwnerContactCardProps = {
  property: Pick<Property, "id" | "title" | "ownerName" | "ownerPhone">;
};

/** Owner: direct call + WhatsApp (URLs respect phone vs desktop WhatsApp Web). */
export function OwnerContactCard({ property }: OwnerContactCardProps) {
  const ownerLabel = property.ownerName?.trim() || "Property owner";
  const phone = property.ownerPhone?.trim();
  const hasPhone = Boolean(phone);

  const openWhatsApp = useCallback(() => {
    if (!phone) return;
    const text = `Hi, I'm interested in "${property.title}" (Ref #${property.id}).`;
    window.open(buildWhatsAppHref(phone, text), "_blank", "noopener,noreferrer");
  }, [phone, property.title, property.id]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-6 flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="wrap-break-word font-heading text-sm font-semibold text-foreground">{ownerLabel}</p>
            <p className="wrap-break-word text-xs text-muted-foreground">Property owner · Direct contact</p>
          </div>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">Ref #{property.id}</p>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          {hasPhone ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Button className="flex-1 gap-2" variant="outline" size="lg" asChild>
                <a href={buildTelHref(phone!)}>
                  <Phone className="h-4 w-4" />
                  Contact
                </a>
              </Button>
              <Button
                type="button"
                className="flex-1 gap-2 bg-[#25D366] text-white hover:bg-[#20BD5A]"
                size="lg"
                onClick={openWhatsApp}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          ) : (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">
              Owner phone is not listed for this property. Check back later.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
