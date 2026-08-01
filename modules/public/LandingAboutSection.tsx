"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, HousePlus, ListChecks, Network } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/settings-context";
import { SITE_NAME } from "@/lib/branding";

const principles = [
  {
    icon: HousePlus,
    title: "Property as a starting point",
    description: "Search and listing tools remain at the centre of the platform.",
  },
  {
    icon: Network,
    title: "Useful services around it",
    description: "Every category solves a practical need before, during, or after a move.",
  },
  {
    icon: ListChecks,
    title: "Clear next actions",
    description: "Structured requests help customers and service partners understand the job.",
  },
];

export function LandingAboutSection() {
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;

  return (
    <section className="border-b border-border bg-muted/20 py-20 sm:py-24">
      <div className="container mx-auto max-w-[1200px] px-4">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
              <Image
                src="/images/about-journey.jpg"
                alt="Modern home exterior representing the full property journey"
                fill
                className="object-cover"
                sizes="(max-width: 1023px) 100vw, 42vw"
              />
              {/* Theme-independent black gradient so caption stays readable in light + dark mode */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5"
              />
              <p className="absolute inset-x-0 bottom-0 p-7 font-heading text-2xl font-semibold leading-tight text-white drop-shadow-sm sm:p-9 sm:text-3xl">
                A property platform designed for what life actually needs next.
              </p>
            </div>
            {/* Floats at top-right so the bottom caption stays fully visible */}
            <div className="absolute right-3 top-3 z-10 w-[min(100%,15.5rem)] rounded-2xl border border-border bg-card p-4 shadow-xl sm:right-5 sm:top-5 sm:w-[14.5rem]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Our focus
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                One connected experience for customers, owners, agents, and vendors.
              </p>
            </div>
          </motion.div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Why {siteName}
            </p>
            <h2 className="mt-5 max-w-2xl font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              We are building around the complete customer journey.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Finding a property can lead to a dozen separate searches—for movers,
              maintenance, finance, technology, and everyday help. {siteName} brings those
              needs into a single, easier-to-understand platform while keeping each service
              request transparent and focused.
            </p>

            <ul className="mt-9 grid gap-4">
              {principles.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Button variant="outline" size="lg" asChild className="mt-8 rounded-xl">
              <Link href="/about">
                Learn about our platform
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
