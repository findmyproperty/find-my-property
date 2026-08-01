"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Clock, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_TRUST = [
  { icon: BadgeCheck, label: "Verified partners" },
  { icon: Clock, label: "On-time, every time" },
  { icon: Wallet, label: "Transparent pricing" },
] satisfies Array<{ icon: LucideIcon; label: string }>;

interface ServiceHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** When set, CTA runs this instead of navigating (e.g. open auth intercept). */
  onCtaClick?: () => void;
  trust?: Array<{ icon: LucideIcon; label: string }>;
  /** Lucide icon used as fallback when no image is provided. */
  Illustration: LucideIcon;
  /** Homepage service photo — shown in the hero panel when set. */
  image?: string;
  imageAlt?: string;
}

export function ServiceHero({
  eyebrow,
  title,
  subtitle,
  ctaLabel = "Request a callback",
  ctaHref = "#request-form",
  onCtaClick,
  trust = DEFAULT_TRUST,
  Illustration,
  image,
  imageAlt = "",
}: ServiceHeroProps) {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-28 md:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
      />

      <div className="container mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-2 md:items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
          <h1 className="mt-5 font-heading text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {onCtaClick ? (
              <Button size="lg" type="button" onClick={onCtaClick}>
                {ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" asChild>
                <a href={ctaHref}>
                  {ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <ul className="mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
            {trust.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          {image ? (
            <>
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-border">
                <Image
                  src={image}
                  alt={imageAlt}
                  fill
                  priority
                  sizes="(max-width: 768px) 90vw, 28rem"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10"
                />
              </div>
            </>
          ) : (
            <>
              <div className="hero-gradient absolute inset-0 rounded-[2rem] opacity-90" />
              <div className="absolute inset-4 rounded-[1.6rem] border border-white/20 bg-white/5 backdrop-blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Illustration
                  className="h-40 w-40 text-primary-foreground drop-shadow-lg md:h-52 md:w-52"
                  aria-hidden
                  strokeWidth={1.25}
                />
              </div>
            </>
          )}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute -bottom-4 left-6 z-10 rounded-xl bg-card px-4 py-3 shadow-xl ring-1 ring-border"
          >
            <p className="text-xs font-medium text-muted-foreground">Avg. response</p>
            <p className="font-heading text-lg font-bold text-foreground">Within 30 min</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="absolute -top-4 right-6 z-10 rounded-xl bg-card px-4 py-3 shadow-xl ring-1 ring-border"
          >
            <p className="text-xs font-medium text-muted-foreground">Customer rating</p>
            <p className="font-heading text-lg font-bold text-foreground">4.8 / 5</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
