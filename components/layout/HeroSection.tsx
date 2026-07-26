"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Home,
  PaintBucket,
  Search,
  Truck,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const HERO_IMAGE = "/images/hero-bg.jpg";

const servicePreview = [
  { icon: Truck, label: "Packers & movers" },
  { icon: PaintBucket, label: "Painting & cleaning" },
  { icon: Wrench, label: "Home repairs" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_34%),linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--muted)_35%,var(--background)))]"
      />
      <div className="mx-auto grid min-h-180 w-full min-w-0 max-w-310 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="min-w-0 max-w-2xl"
        >
          {/* <Badge variant="outline" className="border-primary/25 bg-primary/5 px-3 py-1 text-primary">
            <BadgeCheck data-icon="inline-start" aria-hidden />
            Property, home &amp; everyday services
          </Badge> */}

          <h1 className="mt-7 max-w-full font-heading text-4xl font-bold leading-[1.04] tracking-[-0.04em] text-foreground min-[420px]:text-5xl sm:text-6xl lg:text-7xl">
            Find the right place.
            <span className="mt-2 block text-primary">Get life around it sorted.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Discover properties, connect with owners, and request trusted help for moving,
            cleaning, repairs, loans, careers, events, and more—all through one platform.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="h-12 w-full rounded-xl px-6 sm:w-auto">
              <Link href="/browse">
                <Search data-icon="inline-start" aria-hidden />
                Browse properties
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 w-full rounded-xl px-6 sm:w-auto">
              <Link href="/#services">
                Explore services
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-border pt-6">
            {["Verified listings", "Choice of vendors", "Requests in one place"].map((item) => (
              <p key={item} className="text-xs font-medium leading-5 text-muted-foreground sm:text-sm">
                {item}
              </p>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="relative mx-auto w-full min-w-0 max-w-140 pb-10 lg:pb-0"
        >
          <div className="relative aspect-4/5 overflow-hidden rounded-[2rem] bg-muted shadow-2xl ring-1 ring-foreground/10">
            <Image
              src={HERO_IMAGE}
              alt="Contemporary home representing property discovery and move-in services"
              fill
              priority
              sizes="(max-width: 1023px) 90vw, 44vw"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-foreground/35 via-transparent to-transparent" />
            <div className="absolute right-5 top-5 rounded-full bg-foreground/75 px-3 py-1.5 text-xs font-semibold text-background backdrop-blur">
              Property + services
            </div>
          </div>

          <div className="absolute -bottom-2 left-3 right-3 max-w-[calc(100%-1.5rem)] rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur sm:-left-8 sm:bottom-8 sm:right-auto sm:w-77.5 sm:max-w-none">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Popular after a move</p>
              <Home className="text-primary" aria-hidden />
            </div>
            <ul className="flex flex-col gap-2">
              {servicePreview.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl bg-muted/55 px-3 py-2.5 text-sm text-foreground"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon aria-hidden />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
