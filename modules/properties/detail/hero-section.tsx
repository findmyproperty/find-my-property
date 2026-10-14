"use client";

import { MapPin } from "lucide-react";
import type { Property } from "@/components/property/PropertyCard";

type HeroSectionProps = {
  property: Pick<Property, "title" | "price" | "priceLabel" | "location">;
  images: string[];
  mainImageIndex: number;
  onMainImageChange: (index: number) => void;
};

/** Full-width hero: main image, thumbnail strip, title/price overlay. */
export function HeroSection({
  property,
  images,
  mainImageIndex,
  onMainImageChange,
}: HeroSectionProps) {
  return (
    <div className="relative w-full">
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-muted sm:aspect-[2.4/1]">
        {images.length > 0 ? (
          <img
            loading="lazy"
            src={images[mainImageIndex] ?? images[0]}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No photos
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {images.length > 1 && (
          <div className="absolute top-3 right-3 z-10 flex max-w-[55%] gap-1.5 overflow-x-auto pb-1 sm:top-6 sm:right-6 sm:max-w-none sm:gap-2">
            {images.slice(0, 5).map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onMainImageChange(i)}
                className={`h-11 w-11 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-14 sm:w-14 ${
                  mainImageIndex === i ? "border-white ring-2 ring-white/50" : "border-white/40 hover:border-white/60"
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 z-10 min-w-0 sm:bottom-6 sm:left-6 sm:right-28">
          <h1 className="font-heading text-xl font-bold text-white drop-shadow-sm sm:text-2xl md:text-3xl">
            <span className="break-words">{property.title}</span>
            <span className="whitespace-nowrap">
              {" "}
              · {property.price}
              {property.priceLabel ? (
                <span className="text-base font-semibold text-white/90 sm:text-lg">{property.priceLabel}</span>
              ) : null}
            </span>
          </h1>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 break-words text-sm text-white/90 md:text-base">
            <MapPin className="h-4 w-4 shrink-0" /> <span className="min-w-0">{property.location}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
