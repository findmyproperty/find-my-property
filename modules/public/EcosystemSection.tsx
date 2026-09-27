"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  HandCoins,
  Truck,
  Briefcase,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EcosystemPillar = {
  id: string;
  number: string;
  title: string;
  kicker: string;
  badge: string;
  description: string;
  image: string;
  icon: typeof Building2;
  highlights: string[];
  links: { label: string; href: string }[];
  primaryHref: string;
  primaryActionText: string;
};

export const ECOSYSTEM_PILLARS: EcosystemPillar[] = [
  {
    id: "real-estate",
    number: "01",
    kicker: "Flagship Real Estate",
    title: "Real Estate & Developments",
    badge: "Core Business",
    description:
      "Curated residential sky villas, gated communities, prime commercial developments, and verified direct owner inventory across prime metropolitan hubs.",
    image: "/images/hero-bg.jpg",
    icon: Building2,
    highlights: [
      "100% Legal Title & Verification",
      "Direct Owner & Developer Inventory",
      "Prime Residential & Commercial",
    ],
    links: [
      { label: "Prime Residential Homes", href: "/browse?type=Sale" },
      { label: "Commercial Hubs & Offices", href: "/browse?category=Commercial" },
      { label: "Verified Rental Catalog", href: "/browse?type=Rent" },
      { label: "Browse All Properties", href: "/browse" },
    ],
    primaryHref: "/browse",
    primaryActionText: "Explore Property Portfolio",
  },
  {
    id: "finance",
    number: "02",
    kicker: "Capital & Advisory",
    title: "Loan & Financial Assistance",
    badge: "Tier-1 Lending",
    description:
      "Pre-approved mortgage assistance, commercial project loans, and balance transfer advisory backed by top institutional banking partners.",
    image: "/images/services/loans.png",
    icon: HandCoins,
    highlights: [
      "Pre-Approved Home Mortgages",
      "Commercial Project Funding",
      "Competitive Interest Rates",
    ],
    links: [
      { label: "Home Loans & Mortgage", href: "/loans" },
      { label: "Commercial Project Funding", href: "/loans" },
      { label: "Loan Against Property", href: "/loans" },
      { label: "Balance Transfer Advisory", href: "/loans" },
    ],
    primaryHref: "/loans",
    primaryActionText: "Calculate Loan Eligibility",
  },
  {
    id: "living",
    number: "03",
    kicker: "Living & Handover",
    title: "Relocation & Home Care",
    badge: "Turnkey Setup",
    description:
      "End-to-end relocation crews, move-in painting, deep sanitization, carpentry, and handover repairs backed by verified service level agreements.",
    image: "/images/services/packers-movers.png",
    icon: Truck,
    highlights: [
      "Vetted Shifting & Move-in Crews",
      "48-Hour SLA Guarantee",
      "Handover & Deep Sanitization",
    ],
    links: [
      { label: "Packers & Movers", href: "/packers-movers" },
      { label: "Painting & Cleaning", href: "/painting-cleaning" },
      { label: "Home Repairs & Handover", href: "/home-services" },
      { label: "General Concierge Tasks", href: "/general-services" },
    ],
    primaryHref: "/packers-movers",
    primaryActionText: "Book Shifting & Care",
  },
  {
    id: "enterprise",
    number: "04",
    kicker: "Corporate Growth",
    title: "Enterprise & Specialized Solutions",
    badge: "Consultancy",
    description:
      "Complete IT infrastructure setup, corporate event production, and executive talent advisory for growing businesses, enterprises, and founders.",
    image: "/images/services/it-services.png",
    icon: Briefcase,
    highlights: [
      "Turnkey IT & Network Setup",
      "Corporate Event Production",
      "Executive Talent Placement",
    ],
    links: [
      { label: "IT & Network Infrastructure", href: "/it-services" },
      { label: "Corporate Event Management", href: "/event-management" },
      { label: "Talent & Job Consultancy", href: "/job-consultancy" },
      { label: "Executive Advisory", href: "/contact" },
    ],
    primaryHref: "/it-services",
    primaryActionText: "Consult Enterprise Team",
  },
];

const AUTO_CYCLE_INTERVAL = 5500; // 5.5s

export function EcosystemSection() {
  const [activeId, setActiveId] = useState<string>("real-estate");
  const [isPaused, setIsPaused] = useState(false);

  // Automatic slide rotation with pause on hover
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveId((currentId) => {
        const currentIndex = ECOSYSTEM_PILLARS.findIndex((p) => p.id === currentId);
        const nextIndex = (currentIndex + 1) % ECOSYSTEM_PILLARS.length;
        return ECOSYSTEM_PILLARS[nextIndex].id;
      });
    }, AUTO_CYCLE_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused]);

  const activePillar =
    ECOSYSTEM_PILLARS.find((p) => p.id === activeId) ?? ECOSYSTEM_PILLARS[0];

  return (
    <section
      id="ybdc-ecosystem"
      className="scroll-mt-24 border-b border-border/80 py-20 sm:py-28 bg-background"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>01 — Integrated Ecosystem</span>
              <span className="text-border">•</span>
              <span>Four Strategic Pillars</span>
            </div>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
              Explore The YBDC Platform
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base leading-relaxed text-muted-foreground">
            Real estate sits at the core, surrounded by verified living, financial, and enterprise services for a complete life transition.
          </p>
        </div>

        {/* Pillar Segment Switcher Tabs */}
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {ECOSYSTEM_PILLARS.map((pillar) => {
            const isSelected = pillar.id === activeId;
            const Icon = pillar.icon;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActiveId(pillar.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-300 sm:p-4",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                    : "border-border/70 bg-card/40 hover:border-foreground/20 hover:bg-card/80",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {pillar.number} • {pillar.badge}
                  </span>
                  <span
                    className={cn(
                      "block truncate text-xs font-semibold sm:text-sm transition-colors",
                      isSelected ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {pillar.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Master Active Pillar Showcase Card */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-border/80 bg-card/60 shadow-xl backdrop-blur-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePillar.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-0"
            >
              {/* Left Column: Visual Showcase Frame (No inner badge) */}
              <div className="relative min-h-[340px] sm:min-h-[420px] lg:min-h-[480px] lg:col-span-7 overflow-hidden">
                <Image
                  src={activePillar.image}
                  alt={activePillar.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover brightness-[0.88] transition-transform duration-1000 hover:scale-105"
                />
                {/* Visual Vignette */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20"
                />

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="font-mono text-xs uppercase tracking-widest text-amber-300">
                    {activePillar.kicker}
                  </span>
                  <h3 className="mt-1 font-heading text-2xl sm:text-3xl font-semibold text-white">
                    {activePillar.title}
                  </h3>
                </div>
              </div>

              {/* Right Column: Editorial & Interactive Links */}
              <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5 lg:p-10">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary">
                    <span>{activePillar.kicker}</span>
                  </div>
                  <h3 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {activePillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {activePillar.description}
                  </p>

                  {/* Highlights */}
                  <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
                    {activePillar.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Curated Service Links Grid */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activePillar.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="group flex items-center justify-between rounded-xl border border-border/70 bg-background/80 p-3 text-xs font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        <span className="truncate">{link.label}</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1 shrink-0 ml-1 text-muted-foreground group-hover:text-primary" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Primary Action CTA */}
                <div className="mt-8 border-t border-border/60 pt-5">
                  <Button
                    size="lg"
                    asChild
                    className="w-full rounded-xl font-medium shadow-md transition-transform active:scale-[0.99]"
                  >
                    <Link href={activePillar.primaryHref} className="flex items-center justify-center gap-2">
                      <span>{activePillar.primaryActionText}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
