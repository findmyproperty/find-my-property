"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Check,
  FileText,
  Home,
  Images,
  Layers,
  LayoutGrid,
  MapPin,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingSection } from "./listing-sections";

export type WizardStep = ListingSection & { legacy?: boolean };

function isAmenitiesStep(step: WizardStep) {
  if (step.id === "amenities" || step.id.endsWith("-amenities")) return true;
  return step.title.toLowerCase().includes("amenit");
}

function iconForStep(step: WizardStep): LucideIcon {
  if (step.id === "choice") return Building2;
  if (step.legacy) {
    if (step.id === "location") return MapPin;
    if (step.id === "description") return FileText;
    if (step.id === "amenities") return LayoutGrid;
    if (step.id === "images") return Images;
    if (step.id === "video") return Video;
    if (step.id === "floorplans") return Layers;
    return Home;
  }
  if (isAmenitiesStep(step)) return LayoutGrid;
  if (step.id === "pg-rules" || step.title.toLowerCase().includes("rules")) return FileText;
  if (step.extras?.includes("location") || step.title.toLowerCase().includes("locality")) return MapPin;
  if (step.extras?.includes("images") || step.extras?.includes("video") || step.id.includes("gallery")) {
    return Images;
  }
  const title = step.title.toLowerCase();
  if (title.includes("rent") || title.includes("sale") || title.includes("resale") || title === "pg details") {
    return Wallet;
  }
  return Home;
}

function StepStatusBadge({
  Icon,
  errored,
  completed,
}: {
  Icon: LucideIcon;
  errored: boolean;
  completed: boolean;
}) {
  const showStatus = errored || completed;
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
      <Icon className="h-4 w-4" aria-hidden />
      {showStatus ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background",
            errored ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
          )}
          aria-hidden
        >
          {errored ? <X className="h-2 w-2" strokeWidth={3} /> : <Check className="h-2 w-2" strokeWidth={3} />}
        </span>
      ) : null}
    </span>
  );
}

function hasStepError(index: number, errorStepIndices: readonly number[]) {
  return errorStepIndices.includes(index);
}

export function PropertyWizardNav({
  steps,
  activeIndex,
  errorStepIndices = [],
  onSelect,
  variant = "sidebar",
  className,
}: {
  steps: WizardStep[];
  activeIndex: number;
  errorStepIndices?: readonly number[];
  onSelect: (index: number) => void;
  variant?: "sidebar" | "pills";
  className?: string;
}) {
  if (variant === "pills") {
    return (
      <nav className={cn("flex gap-2", className)} aria-label="Quick navigate">
        {steps.map((step, index) => {
          const active = index === activeIndex;
          const errored = hasStepError(index, errorStepIndices);
          const completed = index < activeIndex && !errored;
          const Icon = iconForStep(step);
          return (
            <button
              key={step.id}
              type="button"
              aria-current={active ? "step" : undefined}
              aria-invalid={errored ? true : undefined}
              title={errored ? `${step.title}: has validation errors` : undefined}
              onClick={() => onSelect(index)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                errored && !active && "border-destructive/50 bg-destructive/10 text-destructive",
                errored && active && "border-destructive bg-destructive text-destructive-foreground",
                !errored && active && "border-primary bg-primary text-primary-foreground shadow-sm",
                !errored && completed && "border-primary/40 bg-primary/5 text-foreground",
                !errored && !active && !completed && "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/40",
              )}
            >
              {errored ? <X className="h-3 w-3 shrink-0" aria-hidden /> : null}
              {!errored && completed ? <Check className="h-3 w-3 shrink-0" aria-hidden /> : null}
              {!errored && !completed ? <Icon className="h-3 w-3 shrink-0 opacity-90" aria-hidden /> : null}
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
          const errored = hasStepError(index, errorStepIndices);
          const completed = index < activeIndex && !errored;
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                aria-invalid={errored ? true : undefined}
                title={errored ? `${step.title}: has validation errors` : undefined}
                onClick={() => onSelect(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border py-2.5 pl-2.5 pr-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  errored && !active && "border-destructive/40 bg-destructive/10 text-foreground",
                  errored && active && "border-destructive/50 bg-destructive/15 font-medium text-foreground shadow-sm",
                  !errored && active && "border-primary/30 bg-primary/10 font-medium text-foreground shadow-sm",
                  !errored && completed && "border-transparent bg-muted/30 text-foreground hover:bg-muted/50",
                  !errored && !active && !completed && "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                    errored && "border-destructive/50 bg-destructive/15 text-destructive",
                    !errored && active && "border-primary/40 bg-primary/15 text-primary",
                    !errored && completed && "border-primary/30 bg-primary/10 text-primary",
                    !errored && !active && !completed && "border-border bg-muted/20 text-muted-foreground",
                  )}
                  aria-hidden
                >
                  <StepStatusBadge Icon={Icon} errored={errored} completed={completed} />
                </span>
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Step {index + 1}
                  </span>
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
