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
  const isTenant = isAuthReady && user?.role === "tenant";

  return (
    <main className="pb-20 pt-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h1 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
            List your property
          </h1>
          <p className="mx-auto max-w-lg px-1 text-sm text-muted-foreground sm:text-base">
            Add your property details and photos, set your price, and receive enquiries from interested people.
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

      </div>
    </main>
  );
}
