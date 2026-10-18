"use client";

import HeroSearchBanner from "@/components/layout/HeroSearchBanner";

export default function HeroSection({ bannerImageUrl }: { bannerImageUrl?: string | null }) {
  return (
    <section className="relative w-full overflow-hidden bg-background">
      <HeroSearchBanner imageUrl={bannerImageUrl} />
    </section>
  );
}
