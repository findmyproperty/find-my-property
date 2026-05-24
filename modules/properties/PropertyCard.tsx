"use client";

import { MapPin, Bed, Bath, Star, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { buildPropertyPath } from "@/lib/property-slug";
import type { Property } from "@/lib/property-view-model";
import Image from "next/image";

export type { FurnishingStatus, Property } from "@/lib/property-view-model";

const PropertyCard = ({
  property,
  index = 0,
  distanceKm = null,
}: {
  property: Property;
  index?: number;
  distanceKm?: number | null;
}) => {
  const primaryImage = property.image || property.images?.[0];

  return (
    <Link href={buildPropertyPath(property.id, property.title)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        className="group cursor-pointer"
      >
        {/* Image container */}
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={property.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground"
              aria-hidden
            >
              No image
            </div>
          )}

          {/* Top-left badge */}
          <div className="absolute top-3 left-3">
            <Badge className="border-0 bg-card/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
              {property.listingType}
            </Badge>
          </div>

          {/* Top-right icons */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {property.isVerified && (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <Star className="w-4 h-4 text-accent-foreground fill-current" />
              </div>
            )}
          </div>
        </div>

        {/* Info below image */}
        <div className="pt-3 space-y-1.5 min-w-0">
          <h3 className="font-heading font-semibold text-foreground text-base leading-tight line-clamp-2 wrap-break-word">
            {property.title}
          </h3>
          <p className="font-heading font-bold text-foreground text-lg wrap-break-word">
            {property.price}
            <span className="text-sm font-normal text-muted-foreground ml-1">{property.priceLabel}</span>
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap gap-y-1">
            <span className="flex min-w-0 items-center gap-1 wrap-break-word">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {property.location ? property.location.split(",")[0] : "—"}
              </span>
            </span>
            {distanceKm != null ? (
              <>
                <span className="text-border shrink-0">•</span>
                <span className="shrink-0 text-xs font-medium text-primary">
                  {distanceKm < 1 ? "< 1 km" : `${distanceKm.toFixed(1)} km`}
                </span>
              </>
            ) : null}
            <span className="text-border shrink-0">•</span>
            <span className="flex items-center gap-1 shrink-0">
              <Bed className="w-3.5 h-3.5" /> {property.bedrooms} BHK
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Bath className="w-3.5 h-3.5" /> {property.bathrooms} Bath
            </span>
            <span className="flex items-center gap-1 min-w-0 wrap-break-word">
              <Square className="w-3.5 h-3.5 shrink-0" /> {property.area}
            </span>
          </div>
          <p className="text-xs text-muted-foreground capitalize wrap-break-word">{property.furnishing.replace("-", " ")}</p>
        </div>
      </motion.div>
    </Link>
  );
};

export default PropertyCard;
