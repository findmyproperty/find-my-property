"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, CheckCircle, Upload, IndianRupee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

const steps = [
  { icon: Building2, title: "Add property details", desc: "Type, location, amenities" },
  { icon: Upload, title: "Upload photos", desc: "Clear photos help serious enquiries" },
  { icon: IndianRupee, title: "Set your price", desc: "Rent or sale — transparent numbers" },
  { icon: CheckCircle, title: "Get enquiries", desc: "Tenants and buyers reach you here" },
];

/** Marketing page for owners — lives under public layout (Navbar + Footer). */
export default function ForOwnersPage() {
  const { user, isAuthReady } = useAuth();
  const isLoggedIn = isAuthReady && !!user;

  return (
    <main className="relative flex min-h-[calc(100dvh-4.5rem)] flex-col justify-center overflow-hidden pt-20 md:pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.55_0.12_155_/_0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.55_0.12_155_/_0.18),transparent_50%)]"
      />
      <div className="container relative z-10 mx-auto flex flex-1 flex-col justify-center px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            For property owners
          </p>
          <h1 className="mb-4 font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            List your property
          </h1>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
            Add your property details and photos, set your price, and receive enquiries from
            interested people.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isLoggedIn ? (
              <>
                <Button size="lg" asChild>
                  <Link href="/add-property">
                    Add property <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/register">
                    Create account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <ol className="mx-auto mt-14 grid w-full max-w-4xl grid-cols-2 gap-6 border-t border-border/60 pt-10 md:mt-16 md:grid-cols-4 md:gap-8 md:pt-12">
          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="space-y-3 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl hero-gradient">
                <step.icon className="h-6 w-6 text-primary-foreground" aria-hidden />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Step {i + 1}
              </p>
              <h3 className="font-heading text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </main>
  );
}
