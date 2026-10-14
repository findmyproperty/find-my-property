"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { PropertySection } from "@/modules/properties/listing-ui";

type LocationMapSectionProps = {
  location: string;
};

/** Embedded map or fallback link to Google Maps. */
export function LocationMapSection({ location }: LocationMapSectionProps) {
  const hasKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <PropertySection title="Neighbourhood">
      <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        {hasKey ? (
          <iframe
            title="Property location"
            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY}&q=${encodeURIComponent(location)}`}
            className="h-full w-full border-0"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full w-full items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> View on Google Maps
            </span>
          </a>
        )}
      </div>
      </PropertySection>
    </motion.div>
  );
}
