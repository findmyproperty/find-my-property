"use client"

import Navbar from "@/components/layout/Navbar"
import HeroSection from "@/components/layout/HeroSection"
import PropertyCard, { type Property } from "@/components/property/PropertyCard"
import Footer from "@/components/layout/Footer"
import AuthGateModal from "@/components/auth/AuthGateModal"
import { PropertyCardSkeleton } from "@/components/skeletons/property-card-skeleton"
import { PropertyGridSkeleton } from "@/components/skeletons/property-grid-skeleton"
import { useAuth } from "@/contexts/auth-context"
import { useProperties } from "@/hooks/use-properties"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Shield,
  Users,
  Wallet,
  Search,
  FileCheck,
  Handshake,
  MapPin,
  Quote,
  Star,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SITE_NAME } from "@/lib/branding"
import { useSettings } from "@/contexts/settings-context"
import { buildPropertyPath } from "@/lib/property-slug"
import { LandingAboutSection } from "@/modules/public/LandingAboutSection"
import { buildPopularCitiesFromProperties } from "@/lib/property-location-options"

const features = [
  {
    icon: Wallet,
    title: "Fair pricing",
    description:
      "Connect directly with owners and avoid unnecessary middleman fees on your next move.",
  },
  {
    icon: Shield,
    title: "Verified listings",
    description:
      "Listings are reviewed so photos and details stay honest and up to date.",
  },
  {
    icon: Users,
    title: "Direct owner contact",
    description:
      "Chat, call, or schedule visits directly with owners — no unnecessary intermediaries.",
  },
]

const howItWorks = [
  {
    step: 1,
    icon: Search,
    title: "Search",
    desc: "Filter by location, budget, BHK & amenities.",
  },
  {
    step: 2,
    icon: FileCheck,
    title: "Shortlist",
    desc: "Narrow your search and compare listings side by side.",
  },
  {
    step: 3,
    icon: Handshake,
    title: "Connect",
    desc: "Contact owners directly. Schedule visits.",
  },
  {
    step: 4,
    icon: Wallet,
    title: "Move In",
    desc: "Transparent pricing. Sign and move in.",
  },
]

const buildTestimonials = (siteName: string) => [
  {
    quote:
      `Found my 3BHK in Whitefield in 3 days. ${siteName}, no hassle. Saved almost ₹50,000!`,
    author: "Priya S.",
    role: "Tenant, Bangalore",
    rating: 5,
  },
  {
    quote:
      "Listed my flat and got a tenant within a week. The platform is simple and transparent.",
    author: "Raj K.",
    role: "Owner, Bangalore",
    rating: 5,
  },
  {
    quote:
      "Finally a site that shows real listings. Verified photos and direct contact made everything easy.",
    author: "Amit P.",
    role: "Tenant, Mumbai",
    rating: 5,
  },
]

type IndexProps = {
  /** SSR-resolved branding used as the source of truth on first paint. */
  siteName?: string
}

const Index = ({ siteName: ssrSiteName }: IndexProps = {}) => {
  const { isAuthenticated, isAuthReady } = useAuth()
  const { data, isLoading } = useProperties()
  const { settings } = useSettings()
  // Prefer the live admin value once the client query resolves, falling back to
  // the SSR-injected value (no flash) and finally the compile-time default.
  const siteName =
    settings?.siteName?.trim() || ssrSiteName?.trim() || SITE_NAME
  const testimonials = useMemo(() => buildTestimonials(siteName), [siteName])
  const allProperties = data ?? []
  const featuredProperties = allProperties.slice(0, 4)
  const popularCities = useMemo(
    () => buildPopularCitiesFromProperties(allProperties, 8),
    [allProperties],
  )
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [pendingProperty, setPendingProperty] = useState<Property | null>(
    null
  )

  const handlePropertyCardClick = (e: React.MouseEvent, property: Property) => {
    if (isAuthReady && !isAuthenticated) {
      e.preventDefault()
      e.stopPropagation()
      setPendingProperty(property)
      setShowAuthGate(true)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <HeroSection />
      {/* Features */}
      <section className="surface-warm py-20">
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              Why Choose {siteName}?
            </h2>
            <p className="mx-auto max-w-lg wrap-break-word text-muted-foreground">
              A simpler way to search and list — clear information, direct contact, less friction.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card-shadow space-y-4 rounded-2xl bg-card p-6 text-center"
              >
                <div className="hero-gradient mx-auto flex h-14 w-14 items-center justify-center rounded-xl">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <LandingAboutSection />

      {/* How it works */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Find or list a property in four simple steps — no hidden charges.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 font-heading font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stop searching. Start living. - Homplus-style split section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4  w-full max-w-[1200px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-border shadow-xl md:min-h-[420px] md:flex-row"
          >
            {/* Left: dark panel */}
            <div className="flex flex-col justify-between bg-foreground p-8 text-background md:w-1/2 md:p-10 lg:p-12">
              <div>
                <h2 className="mb-4 font-heading text-2xl leading-tight font-bold md:text-3xl lg:text-4xl">
                  Stop searching. Start living.
                </h2>
                <p className="mb-2 text-lg text-background/90 md:text-xl">
                  Get closer to your dream home today.
                </p>
                <p className="text-sm text-background/80 md:text-base">
                  Your next chapter starts here; real homes, real deals, real
                  easy.
                </p>
              </div>
              <div className="mt-8 inline-flex w-fit items-center gap-3 rounded-xl bg-background/10 px-4 py-3">
                <Building2 className="h-8 w-8 shrink-0 text-background/90" />
                <div>
                  <p className="font-heading text-2xl font-bold text-background md:text-3xl">
                    ₹400 Cr+
                  </p>
                  <p className="text-sm text-background/80">In real deals</p>
                </div>
              </div>
            </div>
            {/* Right: image with overlay text */}
            <div className="relative aspect-[4/3] min-h-[280px] md:aspect-auto md:min-h-full md:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
                alt="Modern architecture"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/20" />
              <div className="absolute inset-0 flex items-center justify-between px-6 py-8 md:px-10">
                <span className="font-heading text-xl font-bold text-white drop-shadow-lg md:text-2xl lg:text-3xl">
                  Keep
                </span>
                <span className="font-heading text-xl font-bold text-white drop-shadow-lg md:text-2xl lg:text-3xl">
                  It
                </span>
                <span className="font-heading text-xl font-bold text-white drop-shadow-lg md:text-2xl lg:text-3xl">
                  Real.
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20">
        <div className="container mx-auto px-4  w-full max-w-[1200px]">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                Featured Properties
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
                Hand-picked listings to explore on any screen size.
              </p>
            </div>
            <Button variant="outline" asChild className="hidden w-full shrink-0 sm:flex sm:w-auto">
              <Link href="/browse">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <>
              <div className="hidden sm:block">
                <PropertyGridSkeleton count={4} columns="featured" />
              </div>
              <div className="scrollbar-hide  flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[75vw] snap-start">
                    <PropertyCardSkeleton />
                  </div>
                ))}
              </div>
            </>
          ) : featuredProperties.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              No featured listings yet. Check back soon.
            </p>
          ) : (
            <>
              {/* Desktop grid */}
              <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                {featuredProperties.map((property, i) => (
                  <div
                    key={property.id}
                    onClickCapture={(e) =>
                      handlePropertyCardClick(
                        e as unknown as React.MouseEvent,
                        property
                      )
                    }
                    className="cursor-pointer"
                  >
                    <PropertyCard property={property} index={i} />
                  </div>
                ))}
              </div>
              {/* Mobile horizontal scroll */}
              <div className="scrollbar-hide  flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:hidden">
                {featuredProperties.map((property, i) => (
                  <div
                    key={property.id}
                    className="min-w-[75vw] cursor-pointer snap-start"
                    onClickCapture={(e) =>
                      handlePropertyCardClick(
                        e as unknown as React.MouseEvent,
                        property
                      )
                    }
                  >
                    <PropertyCard property={property} index={i} />
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/browse">
                View all listings <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Popular cities */}
      <section className="border-t border-border py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 font-heading text-2xl font-bold text-foreground md:text-3xl">
              Popular Cities
            </h2>
            <p className="text-sm text-muted-foreground">
              Cities ranked by how many listings we currently have on {siteName}
            </p>
          </div>
          {isLoading ? (
            <div className="flex flex-wrap justify-center gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-36 animate-pulse rounded-xl border border-border bg-muted"
                />
              ))}
            </div>
          ) : popularCities.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No city breakdown yet — listings need a saved city on each property. Browse all properties to explore what&apos;s
              live.
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {popularCities.map((city) => (
                <Link
                  key={city.name}
                  href={`/browse?loc=${encodeURIComponent(city.name)}`}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{city.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {city.count} {city.count === 1 ? "listing" : "listings"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              What Our Users Say
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Join people who found their next home or tenant through {siteName}.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <Quote className="mb-3 h-8 w-8 text-primary/30" />
                <p className="mb-4 text-sm leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mb-1 flex items-center gap-2">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {t.author}
                </p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Tenants */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-border bg-card p-8 md:flex-row md:p-12">
            <div>
              <h2 className="mb-2 font-heading text-2xl font-bold text-foreground md:text-3xl">
                Looking for a Home?
              </h2>
              <p className="max-w-md text-muted-foreground">
                Browse verified listings. Filter by budget, location &
                amenities. Contact owners directly.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link href="/browse">
                Browse listings <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA - Owners */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="hero-gradient rounded-3xl p-10 text-center md:p-16">
            <h2 className="mb-4 font-heading text-3xl font-bold text-primary-foreground md:text-4xl">
              Are You a Property Owner?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-primary-foreground/85">
              List your property and reach serious tenants or buyers — simple, transparent, built for {siteName} users.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/owner">
                List Your Property <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>


      <AuthGateModal
        open={showAuthGate}
        onClose={() => {
          setShowAuthGate(false)
          setPendingProperty(null)
        }}
        endpoint={pendingProperty ? buildPropertyPath(pendingProperty.id, pendingProperty.title) : "/browse"}
      />
    </div>
  )
}

export default Index
