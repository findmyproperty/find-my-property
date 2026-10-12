"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Calendar,
  FileText,
  Home,
  Images,
  Layers,
  MapPin,
  Sparkles,
  Video,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingSection } from "./listing-sections";

export type WizardStep = ListingSection & { legacy?: boolean };

function iconForStep(step: WizardStep): LucideIcon {
  if (step.id === "choice") return Building2;
  if (step.legacy) {
    if (step.id === "location") return MapPin;
    if (step.id === "description") return FileText;
    if (step.id === "amenities") return Sparkles;
    if (step.id === "images") return Images;
    if (step.id === "video") return Video;
    if (step.id === "floorplans") return Layers;
    return Home;
  }
  if (step.extras?.includes("location") || step.title.toLowerCase().includes("locality")) return MapPin;
  if (step.extras?.includes("images") || step.extras?.includes("video") || step.id.includes("gallery")) {
    return Images;
  }
  if (step.id.includes("schedule")) return Calendar;
  if (step.title.toLowerCase().includes("amenit")) return Sparkles;
  if (
    step.title.toLowerCase().includes("rent") ||
    step.title.toLowerCase().includes("sale") ||
    step.title.toLowerCase().includes("resale") ||
    step.title.toLowerCase().includes("pg")
  ) {
    return Wallet;
  }
  return Home;
}

export function PropertyWizardNav({
  steps,
  activeIndex,
  onSelect,
  variant = "sidebar",
  className,
}: {
  steps: WizardStep[];
  activeIndex: number;
  onSelect: (index: number) => void;
  variant?: "sidebar" | "pills";
  className?: string;
}) {
  if (variant === "pills") {
    return (
      <nav className={cn("flex gap-2", className)} aria-label="Quick navigate">
        {steps.map((step, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {step.title}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn("space-y-1", className)} aria-label="Quick navigate">
      <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick navigate</p>
      <ul className="space-y-0.5">
        {steps.map((step, index) => {
          const Icon = iconForStep(step);
          const active = index === activeIndex;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-2 text-left text-sm transition-colors",
                  active
                    ? "border-l-[3px] border-primary bg-primary/10 font-medium text-foreground"
                    : "border-l-[3px] border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0 opacity-90" aria-hidden />
                <span className="leading-snug">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
