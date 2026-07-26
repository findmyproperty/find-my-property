"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  HandHelping,
  Home,
  MapPin,
  Monitor,
  MoveRight,
  PaintBucket,
  PartyPopper,
  Search,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import AuthGateModal from "@/components/auth/AuthGateModal";
import HeroSection from "@/components/layout/HeroSection";
import PropertyCard, { type Property } from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/skeletons/property-card-skeleton";
import { PropertyGridSkeleton } from "@/components/skeletons/property-grid-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useSettings } from "@/contexts/settings-context";
import { useProperties } from "@/hooks/use-properties";
import { SITE_NAME } from "@/lib/branding";
import { buildPopularCitiesFromProperties } from "@/lib/property-location-options";
import { buildPropertyPath } from "@/lib/property-slug";
import { LandingAboutSection } from "@/modules/public/LandingAboutSection";

type ServiceItem = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  label: string;
};

const services: ServiceItem[] = [
  {
    href: "/packers-movers",
    title: "Packers & Movers",
    description: "Plan a local or intercity move with the right shifting crew.",
    icon: Truck,
    label: "Move",
  },
  {
    href: "/painting-cleaning",
    title: "Painting & Cleaning",
    description: "Prepare a home for move-in, handover, or a fresh start.",
    icon: PaintBucket,
    label: "Refresh",
  },
  {
    href: "/home-services",
    title: "Home Services",
    description: "Find help for plumbing, electrical work, carpentry, and repairs.",
    icon: Wrench,
    label: "Maintain",
  },
  {
    href: "/event-management",
    title: "Event Management",
    description: "Get planning support for personal and corporate occasions.",
    icon: PartyPopper,
    label: "Celebrate",
  },
  {
    href: "/it-services",
    title: "IT Services",
    description: "Request laptop, network, CCTV, and software assistance.",
    icon: Monitor,
    label: "Connect",
  },
  {
    href: "/general-services",
    title: "General Services",
    description: "Book practical help for errands, assembly, and everyday tasks.",
    icon: HandHelping,
    label: "Get help",
  },
  {
    href: "/loans",
    title: "Loan Assistance",
    description: "Explore support for home, mortgage, personal, and vehicle loans.",
    icon: Wallet,
    label: "Finance",
  },
  {
    href: "/job-consultancy",
    title: "Job Consultancy",
    description: "Share your profile and connect with relevant career opportunities.",
    icon: BriefcaseBusiness,
    label: "Grow",
  },
];

const platformSteps = [
  {
    icon: Search,
    title: "Discover",
    description: "Browse properties or choose the service that matches your need.",
  },
  {
    icon: Users,
    title: "Choose",
    description: "Review useful details and select an available vendor where offered.",
  },
  {
    icon: ClipboardCheck,
    title: "Request",
    description: "Share the essentials once so the right team can follow up.",
  },
  {
    icon: CheckCircle2,
    title: "Keep track",
    description: "Return to your account to follow property and service activity.",
  },
];

const EMPTY_PROPERTIES: Property[] = [];

type IndexProps = {
  siteName?: string;
};

export default function Index({ siteName: ssrSiteName }: IndexProps = {}) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const { data, isLoading } = useProperties();
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || ssrSiteName?.trim() || SITE_NAME;
  const allProperties = data ?? EMPTY_PROPERTIES;
  const featuredProperties = allProperties.slice(0, 4);
  const popularCities = useMemo(
    () => buildPopularCitiesFromProperties(data ?? EMPTY_PROPERTIES, 8),
    [data],
  );
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [pendingProperty, setPendingProperty] = useState<Property | null>(null);

  const handlePropertyCardClick = (event: React.MouseEvent, property: Property) => {
    if (isAuthReady && !isAuthenticated) {
      event.preventDefault();
      event.stopPropagation();
      setPendingProperty(property);
      setShowAuthGate(true);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <HeroSection />

      <section id="services" className="scroll-mt-24 py-20 sm:py-24">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <Badge variant="outline" className="text-primary">
                Beyond property
              </Badge>
              <h2 className="mt-5 max-w-xl font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                From move-in day to everyday life.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end lg:text-lg">
              Property is only one part of the journey. Choose a service, tell us what you
              need, and connect with relevant support without starting your search again
              somewhere else.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ href, title, description, icon: Icon, label }, index) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.04 }}
              >
                <Link href={href} className="group block h-full">
                  <Card className="flex h-full min-h-[250px] flex-col overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-6" aria-hidden />
                        </span>
                        <ArrowUpRight className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                      </div>
                      <CardDescription className="pt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {label}
                      </CardDescription>
                      <CardTitle className="font-heading text-xl leading-tight">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                    </CardContent>
                    <CardFooter>
                      <span className="text-sm font-semibold text-foreground">View service</span>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/25 py-20">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="p-7 md:p-9">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Building2 className="size-6" aria-hidden />
                </span>
                <CardDescription className="pt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Property
                </CardDescription>
                <CardTitle className="max-w-md font-heading text-3xl leading-tight">
                  Search with context, not guesswork.
                </CardTitle>
              </CardHeader>
              <CardContent className="px-7 md:px-9">
                <p className="max-w-lg leading-7 text-muted-foreground">
                  Explore available homes by location, budget, property type, and the
                  details that matter before you make contact.
                </p>
              </CardContent>
              <CardFooter className="p-7 pt-2 md:p-9 md:pt-3">
                <Button asChild>
                  <Link href="/browse">
                    Explore properties
                    <ArrowRight data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="p-7 md:p-9">
                <span className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
                  <HandHelping className="size-6" aria-hidden />
                </span>
                <CardDescription className="pt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Services
                </CardDescription>
                <CardTitle className="max-w-md font-heading text-3xl leading-tight">
                  Turn a requirement into a clear request.
                </CardTitle>
              </CardHeader>
              <CardContent className="px-7 md:px-9">
                <p className="max-w-lg leading-7 text-muted-foreground">
                  Pick a service, provide the useful details, choose a vendor when
                  available, and let the platform keep the request connected to your
                  account.
                </p>
              </CardContent>
              <CardFooter className="p-7 pt-2 md:p-9 md:pt-3">
                <Button variant="outline" asChild>
                  <Link href="/#services">
                    Browse all services
                    <ArrowRight data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="outline" className="text-primary">
                Live property feed
              </Badge>
              <h2 className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl">
                Featured properties
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Start with a place that fits, then use the same platform for what comes next.
              </p>
            </div>
            <Button variant="outline" asChild className="hidden shrink-0 sm:inline-flex">
              <Link href="/browse">
                View all listings
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <>
              <div className="hidden sm:block">
                <PropertyGridSkeleton count={4} columns="featured" />
              </div>
              <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="min-w-[78vw] snap-start">
                    <PropertyCardSkeleton />
                  </div>
                ))}
              </div>
            </>
          ) : featuredProperties.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="font-heading text-2xl">Listings are being prepared</CardTitle>
                <CardDescription>
                  There are no featured properties yet. You can still explore services or
                  return soon for new listings.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button variant="outline" asChild>
                  <Link href="/#services">Explore services</Link>
                </Button>
              </CardContent>
              <CardFooter />
            </Card>
          ) : (
            <>
              <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                {featuredProperties.map((property, index) => (
                  <div
                    key={property.id}
                    onClickCapture={(event) =>
                      handlePropertyCardClick(event as unknown as React.MouseEvent, property)
                    }
                    className="cursor-pointer"
                  >
                    <PropertyCard property={property} index={index} />
                  </div>
                ))}
              </div>
              <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:hidden">
                {featuredProperties.map((property, index) => (
                  <div
                    key={property.id}
                    className="min-w-[78vw] cursor-pointer snap-start"
                    onClickCapture={(event) =>
                      handlePropertyCardClick(event as unknown as React.MouseEvent, property)
                    }
                  >
                    <PropertyCard property={property} index={index} />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-6 sm:hidden">
            <Button variant="outline" asChild className="w-full">
              <Link href="/browse">
                View all listings
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-foreground py-20 text-background sm:py-24">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/60">
                One simple flow
              </p>
              <h2 className="mt-5 max-w-md font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                Less searching around. More moving forward.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-background/70">
                Whether you are looking for a home or practical help, the next action should
                always be clear.
              </p>
            </div>

            <ol className="grid gap-px overflow-hidden rounded-2xl bg-background/15 sm:grid-cols-2">
              {platformSteps.map(({ icon: Icon, title, description }, index) => (
                <li key={title} className="bg-foreground p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-background/10 text-background">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-heading text-sm text-background/40">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-7 font-heading text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-background/65">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <LandingAboutSection />

      <section className="py-20">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="mb-9 text-center">
            <Badge variant="outline" className="text-primary">
              Explore by city
            </Badge>
            <h2 className="mt-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
              See where listings are active
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Locations are ranked by the properties currently available on {siteName}.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-wrap justify-center gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-11 w-36 rounded-xl bg-muted" />
              ))}
            </div>
          ) : popularCities.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              City information will appear when listings include a saved location.
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {popularCities.map((city) => (
                <Link
                  key={city.name}
                  href={`/browse?loc=${encodeURIComponent(city.name)}`}
                  className="group flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 transition-colors hover:border-primary"
                >
                  <MapPin className="size-4 text-primary" aria-hidden />
                  <span className="font-medium text-foreground">{city.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {city.count}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground sm:px-10 md:px-14 md:py-16">
            <div
              aria-hidden
              className="absolute -right-20 -top-20 size-64 rounded-full border border-primary-foreground/15"
            />
            <div
              aria-hidden
              className="absolute -bottom-28 right-24 size-72 rounded-full border border-primary-foreground/10"
            />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
                  Built for the whole ecosystem
                </p>
                <h2 className="mt-4 max-w-2xl font-heading text-4xl font-bold tracking-tight md:text-5xl">
                  Looking for a place—or ready to help someone move forward?
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-primary-foreground/80">
                  Find a property, list one you own, or join as a service vendor and respond
                  to relevant customer needs.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/owner">
                    List a property
                    <Home data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                >
                  <Link href="/register-vendor">
                    Join as a vendor
                    <MoveRight data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthGateModal
        open={showAuthGate}
        onClose={() => {
          setShowAuthGate(false);
          setPendingProperty(null);
        }}
        endpoint={
          pendingProperty
            ? buildPropertyPath(pendingProperty.id, pendingProperty.title)
            : "/browse"
        }
      />
    </main>
  );
}
