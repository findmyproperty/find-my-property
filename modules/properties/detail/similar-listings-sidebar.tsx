"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildPropertyPath } from "@/lib/property-slug";
import type { Property } from "@/components/property/PropertyCard";

type SimilarListingsSidebarProps = {
  properties: Property[];
  variant?: "sidebar" | "bottom";
};

function SimilarListingCard({ p }: { p: Property }) {
  return (
    <Link
      href={buildPropertyPath(p.id, p.title)}
      className="flex gap-3 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {p.image ? <img src={p.image} alt="" className="size-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{p.title}</p>
        <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{p.location}</p>
        <p className="mt-1.5 text-sm font-semibold tabular-nums text-foreground">
          {p.price}
          <span className="text-[11px] font-normal text-muted-foreground">{p.priceLabel}</span>
        </p>
        <p className="text-[11px] text-muted-foreground">{p.area}</p>
      </div>
    </Link>
  );
}

/** Sticky sidebar list (desktop) or full-width grid (mobile / bottom). */
export function SimilarListingsSidebar({
  properties,
  variant = "sidebar",
}: SimilarListingsSidebarProps) {
  if (properties.length === 0) {
    if (variant === "sidebar") return null;
    return (
      <p className="text-sm text-muted-foreground">No similar listings to show.</p>
    );
  }

  if (variant === "bottom") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 md:hidden"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Similar listings</h2>
          <Link
            href="/browse"
            className="text-sm text-primary hover:underline"
          >
            See all
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {properties.map((p) => (
            <li key={p.id}>
              <SimilarListingCard p={p} />
            </li>
          ))}
        </ul>
      </motion.div>
    );
  }

  return (
    <div className="flex min-h-[20rem] w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:min-h-[24rem]">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold text-foreground">Similar listings</h3>
        <Link
          href="/browse"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
        >
          See all
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
      <ScrollArea className="h-full min-h-0 flex-1">
        <ul className="flex flex-col gap-2 p-3">
          {properties.map((p) => (
            <li key={p.id}>
              <SimilarListingCard p={p} />
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
