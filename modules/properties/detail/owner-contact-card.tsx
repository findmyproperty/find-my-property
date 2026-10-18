"use client";



import { useCallback } from "react";

import { motion } from "framer-motion";

import { MessageCircle, Phone, User } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Property } from "@/components/property/PropertyCard";

import { buildTelHref, buildWhatsAppHref } from "@/lib/contact-links";

import { cn } from "@/lib/utils";



type OwnerContactCardProps = {

  property: Pick<Property, "id" | "title" | "ownerName">;

  phone?: string | null;

  contactReady: boolean;

  isSupportContact: boolean;

  compactActions?: boolean;

};



/** Owner: direct call + WhatsApp (URLs respect phone vs desktop WhatsApp Web). */

export function OwnerContactCard({
  property,
  phone,
  contactReady,
  isSupportContact,
  compactActions = false,
}: OwnerContactCardProps) {

  const ownerLabel = isSupportContact
    ? "YDBC Support"
    : property.ownerName?.trim() || "Property owner";

  const hasPhone = Boolean(phone);



  const openWhatsApp = useCallback(() => {

    if (!phone) return;

    const text = `Hi, I'm interested in "${property.title}" (Ref #${property.id}).`;

    window.open(buildWhatsAppHref(phone, text), "_blank", "noopener,noreferrer");

  }, [phone, property.title, property.id]);



  const actionBtnClass = cn(

    "h-11 w-full gap-2",

    compactActions && "md:px-0 md:[&>span]:hidden md:justify-center",

  );



  return (

    <motion.div

      className="block w-full max-w-full shrink-0 self-stretch"

      initial={{ opacity: 0 }}

      animate={{ opacity: 1 }}

      transition={{ delay: 0.22 }}

    >

      <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card">

        <div className="flex w-full items-center gap-3 border-b border-border px-4 py-3">

          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">

            <User className="size-5 text-muted-foreground" aria-hidden />

          </div>

          <div className="min-w-0 flex-1">

            <p className="truncate font-heading text-sm font-semibold text-foreground">{ownerLabel}</p>

            <p className="text-xs text-muted-foreground">
              {isSupportContact ? "Property enquiries" : "Property owner · Direct contact"}
            </p>

          </div>

        </div>



        <p className="px-4 py-2 text-xs text-muted-foreground">Ref #{property.id}</p>



        <div className="border-t border-border px-4 py-3">

          {hasPhone ? (

            <div className="grid w-full grid-cols-2 gap-2">

              <Button className={actionBtnClass} size="lg" asChild>

                <a
                  href={buildTelHref(phone!)}
                  aria-label={isSupportContact ? "Call YDBC support" : "Call owner"}
                >

                  <Phone className="size-4 shrink-0" />

                  <span>Contact</span>

                </a>

              </Button>

              <Button

                type="button"

                className={cn(

                  actionBtnClass,

                  "bg-[#25D366] text-white hover:bg-[#20BD5A]",

                )}

                size="lg"

                onClick={openWhatsApp}

                aria-label={isSupportContact ? "WhatsApp YDBC support" : "WhatsApp owner"}

              >

                <MessageCircle className="size-4 shrink-0" />

                <span>WhatsApp</span>

              </Button>

            </div>

          ) : (

            <p className="rounded-lg bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">

              {!contactReady
                ? "Loading contact options…"
                : isSupportContact
                  ? "YDBC support phone is unavailable."
                  : "Owner phone is not listed for this property."}

            </p>

          )}

        </div>

      </div>

    </motion.div>

  );

}
