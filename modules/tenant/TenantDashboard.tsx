"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/skeletons/property-card-skeleton";
import { useProperties } from "@/hooks/use-properties";
import { motion } from "framer-motion";
import { Clock, Search, Shield, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const perks = [
  { icon: Shield, title: "Property listings", desc: "Browse available listings and their details" },
  { icon: Headphones, title: "Platform support", desc: "Contact us if you need help" },
];

const TenantDashboard = () => {
  const { data, isLoading } = useProperties();
  const properties = data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              Find Your Dream Home <span className="text-accent">Today</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto px-1 text-sm sm:text-base">
              Browse property listings with clear details and contact options.
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link href="/browse">
                <Search className="w-4 h-4 mr-2" /> Browse all listings
              </Link>
            </Button>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-16 max-w-2xl mx-auto">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-5 card-shadow border border-border text-center space-y-3"
              >
                <div className="w-11 h-11 rounded-lg hero-gradient flex items-center justify-center mx-auto">
                  <perk.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-foreground">{perk.title}</h3>
                <p className="text-xs text-muted-foreground">{perk.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Recommended For You</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <>
                  <PropertyCardSkeleton />
                  <PropertyCardSkeleton />
                  <PropertyCardSkeleton />
                </>
              ) : (
                properties
                  .filter((p) => p.type === "rent")
                  .slice(0, 3)
                  .map((property, i) => (
                    <PropertyCard key={property.id} property={property} index={i} />
                  ))
              )}
            </div>
            {!isLoading &&
              properties.filter((p) => p.type === "rent").length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No rentals to show yet.</p>
              )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TenantDashboard;
