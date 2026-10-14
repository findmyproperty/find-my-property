"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buildPropertyPath } from "@/lib/property-slug";
import type { Property } from "@/components/property/PropertyCard";

type SimilarListingsSectionProps = {
  properties: Property[];
};

/** Compact horizontal cards + link to full catalogue. */
export function SimilarListingsSection({ properties }: SimilarListingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-16"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-foreground">Similar listings</h2>
        <Link href="/browse" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          See all listings
        </Link>
      </div>
      {properties.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {properties.map((p) => (
            <li key={p.id}>
              <Link
                href={buildPropertyPath(p.id, p.title)}
                className="flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.image ? (
                    <img src={p.image} alt="" className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium text-sm text-foreground">{p.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{p.location}</p>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                    {p.price}
                    <span className="text-xs font-normal text-muted-foreground">{p.priceLabel}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-xs font-normal text-muted-foreground">{p.area}</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No similar listings to show.</p>
      )}
    </motion.div>
  );
}
