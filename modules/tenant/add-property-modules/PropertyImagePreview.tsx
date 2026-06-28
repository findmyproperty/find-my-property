"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PropertyFormValues } from "./schema";

function formatPreviewPrice(price: unknown, listingType: string): string {
  const value = Number(price) || 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
  if (listingType === "Rent" || listingType === "Lease") {
    return `${formatted}/month`;
  }
  return formatted;
}

function buildPreviewLocation(values: PropertyFormValues): string {
  return [values.address, values.locality, values.city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

type PropertyImagePreviewProps = {
  imageUrl: string;
};

export function PropertyImagePreview({ imageUrl }: PropertyImagePreviewProps) {
  const { watch } = useFormContext<PropertyFormValues>();
  const title = watch("title")?.trim() || "Property title";
  const listingType = watch("listingType") || "Sale";
  const price = formatPreviewPrice(watch("price"), listingType);
  const location = buildPreviewLocation(watch()) || "Address, locality, city";

  const [cropWarning, setCropWarning] = useState<string | null>(null);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Live preview</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          This is how your selected thumbnail will look after publish. The banner
          crops wide images to fill the space.
        </p>
      </div>

      {cropWarning ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {cropWarning}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Property page banner
        </p>
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg bg-muted">
          <img
            key={imageUrl}
            src={imageUrl}
            alt="Property page preview"
            className="h-full w-full object-cover"
            onLoad={(e) => {
              const img = e.currentTarget;
              const ratio = img.naturalWidth / img.naturalHeight;
              if (ratio < 0.9) {
                setCropWarning(
                  "This image is portrait or very tall. The top and bottom will be cropped in the banner. For best results, use a landscape photo (16:9) as the thumbnail.",
                );
              } else if (ratio > 2.4) {
                setCropWarning(
                  "This image is very wide. The left and right edges may be cropped in the banner.",
                );
              } else {
                setCropWarning(null);
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-12 z-10 min-w-0">
            <p className="line-clamp-2 font-heading text-sm font-bold text-white drop-shadow-sm md:text-base">
              {title} · {price}
            </p>
            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-white/90 md:text-xs">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Browse listing card
        </p>
        <div className="max-w-[280px]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <img
              src={imageUrl}
              alt="Listing card preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute top-2 left-2">
              <Badge className="border-0 bg-card/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm">
                {listingType}
              </Badge>
            </div>
          </div>
          <div className="pt-2">
            <p className="line-clamp-2 font-heading text-sm font-semibold text-foreground">
              {title}
            </p>
            <p className="font-heading text-base font-bold text-foreground">
              {price}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </p>
          </div>
        </div>
      </div>

      <p className={cn("text-xs text-muted-foreground")}>
        Tip: choose a landscape property photo as the thumbnail. You can still
        upload flyers or posters as extra gallery images.
      </p>
    </div>
  );
}
