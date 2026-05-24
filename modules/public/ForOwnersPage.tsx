"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, CheckCircle, Upload, IndianRupee, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useAdminProperties } from "@/hooks/use-properties";
import { buildPropertyPath } from "@/lib/property-slug";

const steps = [
  { icon: Building2, title: "Add property details", desc: "Type, location, amenities" },
  { icon: Upload, title: "Upload photos", desc: "Clear photos help serious enquiries" },
  { icon: IndianRupee, title: "Set your price", desc: "Rent or sale — transparent numbers" },
  { icon: CheckCircle, title: "Get enquiries", desc: "Tenants and buyers reach you here" },
];

const PREVIEW_LIMIT = 5;

/**
 * Marketing page for owners — lives under public layout (Navbar + Footer).
 * The sample form is illustrative; real listing uses Add property after sign-in.
 */
export default function ForOwnersPage() {
  const { user, isAuthReady } = useAuth();
  const isAdmin = isAuthReady && user?.role === "admin";
  const isTenant = isAuthReady && user?.role === "tenant";
  const { data: adminProperties = [] } = useAdminProperties({ enabled: isAdmin });

  return (
    <main className="pb-20 pt-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h1 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
            List your property for <span className="text-primary">free</span>
          </h1>
          <p className="mx-auto max-w-lg px-1 text-sm text-muted-foreground sm:text-base">
            Reach tenants and buyers directly — no brokerage layer on our platform.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Create account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          {isTenant ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Use{" "}
              <Link href="/add-property" className="font-medium text-primary underline-offset-4 hover:underline">
                Add property
              </Link>{" "}
              from your dashboard to publish a listing.
            </p>
          ) : null}
        </div>

        <div className="mx-auto mb-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-2 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl hero-gradient">
                <step.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-shadow mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Preview the listing form</h2>
          {isAdmin ? (
            <p className="mb-6 text-sm text-muted-foreground">
              This mirrors what users fill after signing in — fields are disabled here. After you add a listing, open{" "}
              <Link href="/properties" className="font-medium text-primary underline-offset-4 hover:underline">
                All properties
              </Link>{" "}
              to view and manage listings by name.
            </p>
          ) : null}
          <div className="pointer-events-none space-y-5 opacity-80">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Property type</label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Listing type</label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Rent or sale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">For rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input disabled placeholder="e.g. Spacious 3BHK in Whitefield" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input disabled placeholder="City, area" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Price (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input disabled placeholder="Monthly rent or price" className="pl-10" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea disabled placeholder="Describe your property…" rows={3} />
            </div>
          </div>
          {isAdmin && adminProperties.length > 0 ? (
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent listings
              </p>
              <ul className="flex flex-col gap-1.5">
                {adminProperties.slice(0, PREVIEW_LIMIT).map((p) => (
                  <li key={p.id} className="min-w-0">
                    <Link
                      href={buildPropertyPath(p.id, p.title)}
                      className="block truncate text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {p.title || `Listing #${p.id}`}
                    </Link>
                  </li>
                ))}
              </ul>
              {adminProperties.length > PREVIEW_LIMIT ? (
                <Link
                  href="/properties"
                  className="mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  View all {adminProperties.length} properties
                </Link>
              ) : (
                <Link
                  href="/properties"
                  className="mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open All properties
                </Link>
              )}
            </div>
          ) : null}
          <Button className="mt-6 w-full" disabled size="lg">
            <Upload className="mr-2 h-4 w-4" /> Sign in to list
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
