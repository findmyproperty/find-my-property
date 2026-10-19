"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";

const principles = [
  "Browse residential, commercial, and land listings by location and property details.",
  "Roles for tenants, owners, and agents so everyone sees the right tools.",
  "Contact the owner or assigned agent shown on a property listing.",
];

type AboutPageProps = {
  /** SSR-resolved branding used as the source of truth on first paint. */
  siteName?: string;
};

export default function AboutPage({ siteName: ssrSiteName }: AboutPageProps = {}) {
  const { settings } = useSettings();
  const siteName =
    settings?.siteName?.trim() || ssrSiteName?.trim() || SITE_NAME;
  return (
    <main className="pb-20 pt-24">
      <div className="container mx-auto max-w-3xl px-4">
        <Button variant="ghost" size="sm" asChild className="mb-8 -ml-2 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            About {siteName}
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Property search that respects your time
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            We&apos;re building a calmer alternative to noisy listing sites: fewer surprises, clearer ownership of
            conversations, and a product team focused on the practical work — listing reviews, permissions, and
            performance on real devices.
          </p>
        </motion.div>

        <section className="mb-16 space-y-4">
          <h2 className="font-heading text-2xl font-semibold text-foreground">What you can do</h2>
          <ul className="space-y-3">
            {principles.map((line) => (
              <li key={line} className="flex gap-3 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-8 md:p-10">
          <h2 className="font-heading text-xl font-semibold text-foreground">Talk to us</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Press, partnerships, or product feedback — we read every message we can.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/contact">Go to contact</Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
