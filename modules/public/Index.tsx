"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  HandHelping,
  Home,
  MapPin,
  MoveRight,
  Search,
  Star,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import AuthGateModal from "@/components/auth/AuthGateModal";
import HeroSection from "@/components/layout/HeroSection";
import { UserAvatar } from "@/components/user-avatar";
import PropertyCard, { type Property } from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/skeletons/property-card-skeleton";
import { PropertyGridSkeleton } from "@/components/skeletons/property-grid-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { api, type CustomerReactionDTO } from "@/lib/api";
import { SITE_NAME } from "@/lib/branding";
import { buildPopularCitiesFromProperties } from "@/lib/property-location-options";
import { buildPropertyPath } from "@/lib/property-slug";
import { cn } from "@/lib/utils";
import { LandingAboutSection } from "@/modules/public/LandingAboutSection";
import { SERVICE_IMAGES } from "@/modules/services/service-images";

type ServiceItem = {
  href: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

const services: ServiceItem[] = [
  {
    href: "/packers-movers",
    title: "Packers & Movers",
    description: "Plan a local or intercity move with the right shifting crew.",
    image: SERVICE_IMAGES.packersMovers.src,
    imageAlt: SERVICE_IMAGES.packersMovers.alt,
  },
  {
    href: "/painting-cleaning",
    title: "Painting & Cleaning",
    description: "Prepare a home for move-in, handover, or a fresh start.",
    image: SERVICE_IMAGES.paintingCleaning.src,
    imageAlt: SERVICE_IMAGES.paintingCleaning.alt,
  },
  {
    href: "/home-services",
    title: "Home Services",
    description: "Find help for plumbing, electrical work, carpentry, and repairs.",
    image: SERVICE_IMAGES.homeServices.src,
    imageAlt: SERVICE_IMAGES.homeServices.alt,
  },
  {
    href: "/event-management",
    title: "Event Management",
    description: "Get planning support for personal and corporate occasions.",
    image: SERVICE_IMAGES.eventManagement.src,
    imageAlt: SERVICE_IMAGES.eventManagement.alt,
  },
  {
    href: "/it-services",
    title: "IT Services",
    description: "Request laptop, network, CCTV, and software assistance.",
    image: SERVICE_IMAGES.itServices.src,
    imageAlt: SERVICE_IMAGES.itServices.alt,
  },
  {
    href: "/general-services",
    title: "General Services",
    description: "Book practical help for errands, assembly, and everyday tasks.",
    image: SERVICE_IMAGES.generalServices.src,
    imageAlt: SERVICE_IMAGES.generalServices.alt,
  },
  {
    href: "/loans",
    title: "Loan Assistance",
    description: "Explore support for home, mortgage, personal, and vehicle loans.",
    image: SERVICE_IMAGES.loans.src,
    imageAlt: SERVICE_IMAGES.loans.alt,
  },
  {
    href: "/job-consultancy",
    title: "Job Consultancy",
    description: "Share your profile and connect with relevant career opportunities.",
    image: SERVICE_IMAGES.jobConsultancy.src,
    imageAlt: SERVICE_IMAGES.jobConsultancy.alt,
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
const EMPTY_REACTIONS: CustomerReactionDTO[] = [];

type IndexProps = {
  siteName?: string;
};

export default function Index({ siteName: ssrSiteName }: IndexProps = {}) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const { data, isLoading } = useProperties();
  const { data: customerReactions = EMPTY_REACTIONS } = useQuery({
    queryKey: ["customer-reactions"],
    queryFn: api.getCustomerReactions,
    staleTime: 5 * 60 * 1000,
  });
  const averageReaction = customerReactions.length
    ? customerReactions.reduce((sum, reaction) => sum + reaction.rating, 0) /
      customerReactions.length
    : 0;
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || ssrSiteName?.trim() || SITE_NAME;

  const defaultFaqItems = [
    {
      question: `Why should I trust ${siteName}?`,
      answer:
        `Trust is our foundation. We carefully evaluate vendors before they join our platform and continue to monitor their performance. Our objective is to help customers connect with reliable professionals while providing support if issues arise.`,
    },
    {
      question: "How do I know the vendor is genuine?",
      answer:
        `We require vendors to complete a verification process before they are approved. Depending on the service category, this may include identity verification, business information, relevant registrations, experience, and other supporting documents.`,
    },
    {
      question: "What if the vendor takes my money and disappears?",
      answer:
        `We encourage customers to report such incidents immediately. We will investigate the complaint and take action against vendors who violate our policies, including suspension or removal from the platform. We also assist in communication wherever possible.`,
    },
    {
      question: `Is ${siteName} responsible for the vendor's work?`,
      answer:
        `We connect customers with verified vendors. The service agreement is between the customer and the vendor. However, we monitor quality, review complaints, and take appropriate action against vendors who fail to meet our standards.`,
    },
    {
      question: `Why should I use ${siteName} instead of Google?`,
      answer:
        `Google provides search results. We focus on connecting customers with vendors who have been reviewed and monitored within our ecosystem, making the search process more structured and reliable.`,
    },
  ];

  const faqItems = settings?.faqs && settings.faqs.length > 0 ? settings.faqs : defaultFaqItems;

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
        <div className="container mx-auto max-w-300 px-4">
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
            {services.map(({ href, title, description, image, imageAlt }, index) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.05, duration: 0.45 }}
              >
                <Link
                  href={href}
                  className={cn(
                    "group relative block aspect-4/5 overflow-hidden rounded-2xl",
                    "outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-focus-visible:scale-105"
                    priority={index < 4}
                  />

                  {/* Soft gradient so the text panel stays readable */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/20"
                  />

                  {/* Title always visible; description + arrow expand on hover/focus */}
                  <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
                    <div className="rounded-[1.35rem] bg-background px-4 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.14)] transition-[padding] duration-300 ease-out group-hover:px-4 group-hover:pb-5 group-hover:pt-5 group-focus-visible:pb-5 group-focus-visible:pt-5 sm:px-5 sm:py-5">
                      <h3 className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground sm:text-[1.2rem]">
                        {title}
                      </h3>

                      <div
                        className={cn(
                          "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
                          // Collapsed by default on hover-capable devices; always open on touch.
                          "grid-rows-[0fr] opacity-0 [@media(hover:none)]:mt-3 [@media(hover:none)]:grid-rows-[1fr] [@media(hover:none)]:opacity-100",
                          "group-hover:mt-3 group-hover:grid-rows-[1fr] group-hover:opacity-100",
                          "group-focus-visible:mt-3 group-focus-visible:grid-rows-[1fr] group-focus-visible:opacity-100",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="flex items-end justify-between gap-3 pt-1">
                            <p className="text-sm leading-6 text-muted-foreground">
                              {description}
                            </p>
                            <span
                              className="mb-0.5 flex size-8 shrink-0 items-center justify-center text-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5"
                              aria-hidden
                            >
                              <ArrowUpRight className="size-6 stroke-[1.5]" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/25 py-20">
        <div className="container mx-auto max-w-300 px-4">
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <Card className="flex h-full flex-col overflow-hidden border-primary/20">
              <CardHeader className="space-y-0 p-7 md:p-9">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Building2 className="size-6" aria-hidden />
                </span>
                <CardDescription className="pt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Property
                </CardDescription>
                <CardTitle className="mt-2 min-h-18 font-heading text-3xl leading-tight">
                  Search with context, not guesswork.
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-7 md:px-9">
                <p className="flex-1 leading-7 text-muted-foreground">
                  Explore available homes by location, budget, property type, and the
                  details that matter before you make contact.
                </p>
              </CardContent>
              <CardFooter className="mt-auto p-7 pt-6 md:p-9 md:pt-6">
                <Button asChild>
                  <Link href="/browse">
                    Explore properties
                    <ArrowRight data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex h-full flex-col overflow-hidden border-primary/20">
              <CardHeader className="space-y-0 p-7 md:p-9">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <HandHelping className="size-6" aria-hidden />
                </span>
                <CardDescription className="pt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Services
                </CardDescription>
                <CardTitle className="mt-2 min-h-18 font-heading text-3xl leading-tight">
                  Turn a requirement into a clear request.
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-7 md:px-9">
                <p className="flex-1 leading-7 text-muted-foreground">
                  Pick a service, provide the useful details, choose a vendor when
                  available, and let the platform keep the request connected to your
                  account.
                </p>
              </CardContent>
              <CardFooter className="mt-auto p-7 pt-6 md:p-9 md:pt-6">
                <Button asChild>
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
        <div className="container mx-auto max-w-300 px-4">
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
        <div className="container mx-auto max-w-300 px-4">
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
        <div className="container mx-auto max-w-300 px-4">
          <div className="flex flex-col gap-6 border-b border-border pb-8 mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="outline" className="text-primary">
                Explore by city
              </Badge>
              <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                See where listings are active
              </h2>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground sm:pb-1">
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

      <section className="border-y border-border bg-muted/25 py-20 sm:py-24">
        <div className="container mx-auto max-w-300 px-4">
          <div className="flex flex-col gap-6 border-b border-border pb-8 mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="outline" className="text-primary">
                Good to know
              </Badge>
              <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Common questions, answered clearly.
              </h2>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground sm:pb-1">
              A quick guide to finding a property, requesting support, and keeping your next step easy to follow.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full rounded-2xl border border-border bg-background px-6">
              {faqItems.map(({ question, answer }, index) => (
                <AccordionItem key={question} value={`faq-${index}`}>
                  <AccordionTrigger className="gap-6 text-left font-heading text-base font-semibold hover:no-underline sm:text-lg">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl leading-7 text-muted-foreground">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {customerReactions.length > 0 ? (
      <section className="py-20 sm:py-24">
        <div className="container mx-auto max-w-300 px-4">
          <div className="flex flex-col gap-8 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="outline" className="text-primary">
                Customer reactions
              </Badge>
              <h2 className="mt-4 max-w-xl font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                A smoother way to move forward.
              </h2>
            </div>
            <div className="flex items-center gap-3 sm:pb-1">
              <div
                className="flex items-center gap-1 text-primary"
                aria-label={`${averageReaction.toFixed(1)} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn("size-5", index < Math.round(averageReaction) && "fill-current")}
                    aria-hidden
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {averageReaction.toFixed(1)} average from {customerReactions.length} reaction
                {customerReactions.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 pt-8 md:grid-cols-3">
            {customerReactions.map(({ id, feedback, name, service, rating }) => (
              <article
                key={id}
                className="flex min-h-56 flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 sm:p-7"
              >
                <div>
                  <span className="font-heading text-4xl leading-none text-primary/50" aria-hidden>
                    &ldquo;
                  </span>
                  <blockquote className="mt-3 text-base leading-7 text-foreground">
                    {feedback || "The service made the next step easier."}
                  </blockquote>
                </div>
                <footer className="mt-8 flex items-end justify-between gap-4 border-t border-border pt-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar name={name} className="size-10 shrink-0" />
                    <div>
                      <p className="font-heading text-sm font-semibold text-foreground">{name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{service}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-primary" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={cn("size-3.5", index < rating && "fill-current")}
                        aria-hidden
                      />
                    ))}
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      <section className="pt-20 pb-20 sm:pt-24 sm:pb-24">
        <div className="container mx-auto max-w-300 px-4">
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

      <section className="border-b border-border bg-muted/30 py-20 sm:py-24">
        <div className="container mx-auto max-w-300 px-4 text-center">
          <Badge variant="outline" className="text-primary px-3.5 py-1">
            Looking for the best service?
          </Badge>
          <h2 className="mx-auto mt-6  font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl leading-tight">
            &ldquo;Business owners don&apos;t need more advertisements.<br className="hidden sm:inline" />
            They need <span className="text-primary">more revenue</span>.&rdquo;
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {siteName} is built to help verified businesses grow through trusted opportunities,
            transparent systems, and long-term partnerships.
          </p>
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
