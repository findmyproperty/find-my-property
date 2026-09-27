"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, HousePlus, ListChecks, Network, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/settings-context";
import { SITE_NAME } from "@/lib/branding";

const principles = [
  {
    icon: HousePlus,
    title: "Real estate as the flagship anchor",
    description: "Search and title-verified property listings lead the front of the platform.",
  },
  {
    icon: Network,
    title: "Turnkey living services around it",
    description: "Relocation, painting, cleaning, and repairs solve essential move-in needs.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted partners & transparent SLAs",
    description: "Verified providers, fixed pricing, and monitored customer protection.",
  },
];

export function LandingAboutSection() {
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;

  return (
    <section className="border-b border-border/80 bg-muted/20 py-20 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-2xl">
              <Image
                src="/images/about-journey.jpg"
                alt="Modern home exterior representing the full property journey"
                fill
                className="object-cover"
                sizes="(max-width: 1023px) 100vw, 42vw"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"
              />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                <span className="font-mono text-xs uppercase tracking-widest text-amber-300 block mb-2">
                  Institutional Mission
                </span>
                <p className="font-heading text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  A property ecosystem designed for what life actually needs next.
                </p>
              </div>
            </div>

            {/* Architectural Floating Card */}
            <div className="absolute right-3 top-3 z-10 w-[min(100%,15.5rem)] rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md sm:right-5 sm:top-5 sm:w-[15rem]">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                Ecosystem Model
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                One unified network connecting property buyers, owners, lenders, and vetted service crews.
              </p>
            </div>
          </motion.div>

          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
              <span>Why {siteName}</span>
              <span className="text-border">•</span>
              <span>Yashas Business Development &amp; Consultancy</span>
            </div>

            <h2 className="mt-3 max-w-2xl font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl leading-tight">
              Bridging Property Discovery With Complete Execution.
            </h2>
            <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              {siteName} was established to solve fragmented real estate and home services.
              Instead of dealing with unvetted classified ads or juggling unverified contractors,
              we provide verified residential and commercial developments alongside vetted professionals for relocation, legal due-diligence, and capital advisory.
            </p>

            <ul className="mt-8 grid gap-3">
              {principles.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-foreground/30">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-heading text-sm sm:text-base font-semibold text-foreground">{title}</h3>
                    <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-4">
              <Button size="lg" asChild className="rounded-xl font-medium">
                <Link href="/about">
                  Explore About The YBDC
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
