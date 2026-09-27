"use client";

import ModonHeroCarousel from "@/components/layout/ModonHeroCarousel";

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-background">
      {/* 01. FULL-SCREEN MODON-STYLE HERO CAROUSEL */}
      <ModonHeroCarousel />

      {/* 02. ARCHITECTURAL PROOF & TRUST METRICS BAR */}
      <div className="border-b border-border/70 bg-card/60 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
            <div className="border-l-2 border-primary/60 pl-3.5">
              <div className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                100%
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Title Checked &amp; Verified</p>
            </div>
            <div className="border-l-2 border-primary/60 pl-3.5">
              <div className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                ₹750Cr+
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Direct Property Portfolio</p>
            </div>
            <div className="border-l-2 border-primary/60 pl-3.5">
              <div className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                4-Pillar
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Full-Life Living Ecosystem</p>
            </div>
            <div className="border-l-2 border-primary/60 pl-3.5">
              <div className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                48h SLA
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Service Handover Guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
