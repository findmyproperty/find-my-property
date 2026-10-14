"use client";

import { motion } from "framer-motion";
import {
  AirVent,
  ArrowUpDown,
  Baby,
  Bath,
  BedDouble,
  Brush,
  Building2,
  Car,
  CloudRain,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Landmark,
  Leaf,
  Phone,
  Shield,
  ShoppingBag,
  Store,
  Trees,
  Tv,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { PropertySection } from "@/modules/properties/listing-ui";

type AmenitiesSectionProps = {
  amenities: string[];
};

/** Match amenity labels (NoBroker-style list) to distinct icons — specific rules first. */
function iconForAmenity(name: string): LucideIcon {
  const n = name.toLowerCase().replace(/\s+/g, " ").trim();

  if (n.includes("air condition") || n.includes("a/c") || n === "ac" || n.includes("ac room")) {
    return AirVent;
  }
  if (n.includes("children") || n.includes("play area") || n.includes("playground") || n.includes("kids")) {
    return Baby;
  }
  if (n.includes("intercom")) return Phone;
  if (n.includes("lift") || n.includes("elevator")) return ArrowUpDown;
  if (n.includes("servant")) return BedDouble;
  if (n.includes("gas") || n.includes("pipeline")) return Flame;
  if (n.includes("house keep") || n.includes("housekeep") || n.includes("housekeeping")) return Brush;
  if (n.includes("visitor") && n.includes("park")) return Car;
  if (n.includes("rain") && (n.includes("harvest") || n.includes("water"))) return CloudRain;
  if (n.includes("swim") || n.includes("pool")) return Waves;
  if (n.includes("internet") || n.includes("wifi") || n.includes("broadband")) return Wifi;
  if (n.includes("shopping") || n.includes("mall") || n.includes("retail")) return ShoppingBag;
  if (n.includes("club house") || n.includes("clubhouse") || (n.includes("club") && n.includes("house"))) {
    return Landmark;
  }
  if (n.includes("sewage") || n.includes("treatment") || n.includes("stp")) return Droplets;
  if (n.includes("gym") || n.includes("fitness")) return Dumbbell;
  if (n.includes("security") || n.includes("cctv") || n.includes("gated")) return Shield;
  if (n.includes("parking") || n.includes("car park")) return Car;
  if (n.includes("garden") || n.includes("landscap") || n.includes("lawn")) return Trees;
  if (n.includes("power") || n.includes("backup") || n.includes("generator")) return Flame;
  if (n.includes("cafeteria") || n.includes("canteen") || n.includes("mess")) return UtensilsCrossed;
  if (n.includes("coffee") || n.includes("vending")) return Coffee;
  if (n.includes("tv") || n.includes("cable") || n.includes("dth")) return Tv;
  if (n.includes("laundry") || n.includes("washing")) return Bath;
  if (n.includes("eco") || n.includes("solar") || n.includes("green")) return Leaf;
  if (n.includes("store") || n.includes("shop")) return Store;
  if (n.includes("wind") || n.includes("ventilation")) return Wind;

  return Building2;
}

/** NoBroker-style amenity tiles in a divided row. */
export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <PropertySection title="Amenities">
        {amenities.length > 0 ? (
          <div className="grid grid-cols-2 gap-0 divide-x divide-border sm:grid-cols-3 md:grid-cols-4">
            {amenities.map((amenity) => {
              const Icon = iconForAmenity(amenity);
              return (
                <div
                  key={amenity}
                  className="flex flex-col items-center justify-center gap-3 px-3 py-6 text-center"
                >
                  <div className="flex size-14 items-center justify-center rounded-lg bg-muted/50">
                    <Icon className="size-7 text-primary" strokeWidth={1.5} aria-hidden />
                  </div>
                  <span className="text-xs font-medium leading-snug text-muted-foreground">{amenity}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No amenities listed for this property.</p>
        )}
      </PropertySection>
    </motion.div>
  );
}
