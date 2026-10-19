"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";

import AuthGateModal from "@/components/auth/AuthGateModal";
import HeroSection from "@/components/layout/HeroSection";
import { UserAvatar } from "@/components/user-avatar";
import PropertyCard, { type Property } from "@/components/property/PropertyCard";
import { PropertyGridSkeleton } from "@/components/skeletons/property-grid-skeleton";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useSettings } from "@/contexts/settings-context";
import { useProperties } from "@/hooks/use-properties";
import { api, type CustomerReactionDTO } from "@/lib/api";
import { SITE_NAME } from "@/lib/branding";
import { buildPropertyPath } from "@/lib/property-slug";
import { cn } from "@/lib/utils";
import { LandingAboutSection } from "@/modules/public/LandingAboutSection";
import { EcosystemSection } from "@/modules/public/EcosystemSection";
import type { Settings } from "@/schema/setting";

const platformSteps = [
  {
    icon: Search,
    step: "01",
    title: "Browse properties",
    description: "Find residential, commercial, and land listings by location and property type.",
  },
  {
    icon: ShieldCheck,
    step: "02",
    title: "Review listing details",
    description: "Compare the location, pricing, photos, and other information provided with each listing.",
  },
  {
    icon: ClipboardCheck,
    step: "03",
    title: "Contact the listing representative",
    description: "Send an enquiry to the owner or assigned agent shown for the property.",
  },
  {
    icon: CheckCircle2,
    step: "04",
    title: "Arrange a visit",
    description: "Coordinate a property viewing directly with the listing representative.",
  },
];

const EMPTY_PROPERTIES: Property[] = [];
const EMPTY_REACTIONS: CustomerReactionDTO[] = [];

type IndexProps = {
  siteName?: string;
  serverSettings?: Settings | null;
  popularCitiesContent?: React.ReactNode;
  children?: React.ReactNode;
};

export default function Index({
  siteName: ssrSiteName,
  serverSettings,
  popularCitiesContent,
  children,
}: IndexProps = {}) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const { data, isLoading } = useProperties({ enabled: !children });
  const { data: customerReactions = EMPTY_REACTIONS } = useQuery({
    queryKey: ["customer-reactions"],
    queryFn: api.getCustomerReactions,
    staleTime: 5 * 60 * 1000,
  });
  const averageReaction = customerReactions.length
    ? customerReactions.reduce((sum, reaction) => sum + reaction.rating, 0) /
      customerReactions.length
    : 0;
  const { settings: clientSettings } = useSettings();
  const settings = { ...serverSettings, ...clientSettings };
  const siteName = settings?.siteName?.trim() || ssrSiteName?.trim() || SITE_NAME;

  const defaultFaqItems = [
    {
      question: `What can I do on ${siteName}?`,
      answer:
        `${siteName} helps you browse property listings and connect with the listing representative. Related home, finance, and business services are also available through the platform.`,
    },
    {
      question: "How are property listings reviewed?",
      answer:
        "New property listings are reviewed by the platform team before approval. Approval is a platform review and is not a legal title guarantee; buyers and tenants should verify documents independently before proceeding.",
    },
    {
      question: "Who can I contact about a property?",
      answer:
        "Use the enquiry options on the property page to contact the owner or the agent assigned to that listing.",
    },
    {
      question: "Where can I get help with a service request?",
      answer:
        "Check your account for available request updates, or contact platform support if you need help.",
    },
    {
      question: `How can I compare properties on ${siteName}?`,
      answer:
        "Browse listings and compare their available location, price, photos, amenities, and property details. Contact the listing representative to confirm information before making a decision.",
    },
  ];

  const faqItems = settings?.faqs && settings.faqs.length > 0 ? settings.faqs : defaultFaqItems;

  const allProperties = data ?? EMPTY_PROPERTIES;
  const featuredProperties = allProperties.slice(0, 4);
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
      {/* 01. EDITORIAL HERO & INTELLIGENT SEARCH DOCK */}
      <HeroSection bannerImageUrl={settings?.heroBannerImageUrl} />

      {/* 02. "EXPLORE THE YBDC" — ARCHITECTURAL 4-PILLAR ECOSYSTEM SHOWCASE */}
      <EcosystemSection />

      {/* 03. FEATURED PROPERTY LISTINGS */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Kicker */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-8 border-b border-border/60 mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
                <span>02 — Property Listings</span>
                <span className="text-border">•</span>
                <span>Residential, Commercial &amp; Land</span>
              </div>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                Featured Properties
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground text-sm sm:text-base leading-relaxed">
                Explore available property listings and review the details provided by each representative.
              </p>
            </div>
            <Button variant="outline" asChild className="rounded-xl shrink-0 h-11 px-5 font-medium">
              <Link href="/browse">
                View All Catalog
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
          </div>

          {children ?? (
            isLoading ? (
              <div className="hidden sm:block">
                <PropertyGridSkeleton count={4} columns="featured" />
              </div>
            ) : featuredProperties.length === 0 ? (
              <Card className="rounded-2xl border-border/80">
                <CardHeader className="text-center py-16">
                  <Building2 className="mx-auto size-12 text-primary/40 mb-3" />
                  <CardTitle className="font-heading text-2xl">No featured properties yet</CardTitle>
                  <CardDescription className="max-w-md mx-auto mt-2">
                    Browse all available listings or add your property to the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-12 gap-3">
                  <Button asChild className="rounded-xl">
                    <Link href="/owner">List a property</Link>
                  </Button>
                  <Button variant="outline" asChild className="rounded-xl">
                    <Link href="/browse">Explore catalog</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            )
          )}
        </div>
      </section>

      {/* 04. PROPERTY LISTING INFORMATION */}
      <section className="border-y border-border/80 bg-muted/20 py-20 sm:py-28">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/60 mb-12">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
                <span>03 — The YBDC Standard</span>
                <span className="text-border">•</span>
                <span>Listing Information</span>
              </div>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                Clearer property decisions
              </h2>
            </div>
            <p className="max-w-md text-sm sm:text-base leading-relaxed text-muted-foreground">
              Review available listing details, compare properties, and contact the representative before deciding.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-colors hover:border-foreground/30">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                Reviewed listings
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                New property submissions are reviewed by the platform team before approval.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-colors hover:border-foreground/30">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Award className="size-5" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                Listing contacts
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Property pages show the owner or assigned agent contact for enquiries.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-colors hover:border-foreground/30">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileCheck2 className="size-5" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                Property details
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Review available pricing, location, photos, floor plans, and listed amenities.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-colors hover:border-foreground/30">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="size-5" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                Platform support
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Contact the YBDC team for help with listings or service requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 05. PROPERTY BROWSING FLOW */}
      <section className="border-b border-border/80 bg-foreground py-20 text-background sm:py-28">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-background/60">
                04 — Finding a Property
              </span>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
                From Browsing to a Property Visit.
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-background/70">
                From finding a property to contacting its representative, the next steps stay clear.
              </p>
            </div>

            <ol className="grid gap-px overflow-hidden rounded-2xl bg-background/15 sm:grid-cols-2">
              {platformSteps.map(({ icon: Icon, step, title, description }) => (
                <li key={title} className="bg-foreground p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-background/10 text-background">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-mono text-xs text-background/40">
                      {step}
                    </span>
                  </div>
                  <h3 className="mt-6 font-heading text-lg sm:text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-background/65">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 06. EDITORIAL ABOUT SECTION */}
      <LandingAboutSection />

      {/* 07. ACTIVE LOCALITY & CITY HUBS WITH INTERACTIVE MAP BACKDROP */}
      {popularCitiesContent}

      {/* 08. INSTITUTIONAL FAQ & CLARITY */}
      <section className="bg-muted/20 py-20 sm:py-28 border-b border-border/80">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
              <span>06 — Platform FAQ</span>
            </div>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              Clarity &amp; Common Inquiries
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Find answers about property listings, enquiries, and platform services.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItems.map(({ question, answer }: { question: string; answer: string }, index: number) => (
              <AccordionItem
                key={question}
                value={`faq-${index}`}
                className="rounded-2xl border border-border/80 bg-card px-6 py-1 data-[state=open]:border-foreground/30 shadow-xs"
              >
                <AccordionTrigger className="gap-6 text-left font-heading text-base font-semibold hover:no-underline sm:text-lg py-4">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-sm text-muted-foreground pb-4">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 09. CUSTOMER REVIEWS & CASE EVIDENCE */}
      {customerReactions.length > 0 && (
        <section className="py-20 sm:py-28 border-b border-border/80">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 pb-8 border-b border-border/60 sm:flex-row sm:items-end sm:justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
                  <span>07 — Customer Feedback</span>
                </div>
                <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                  Client Feedback &amp; Experiences
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={cn("size-4", index < Math.round(averageReaction) && "fill-current")}
                    />
                  ))}
                </div>
                <span>{averageReaction.toFixed(1)} / 5.0 Rating</span>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {customerReactions.map(({ id, feedback, name, service, rating }) => (
                <article
                  key={id}
                  className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-colors hover:border-foreground/30"
                >
                  {feedback ? (
                    <blockquote className="text-sm leading-relaxed text-foreground">
                      &ldquo;{feedback}&rdquo;
                    </blockquote>
                  ) : (
                    <p className="text-sm text-muted-foreground">Customer rating</p>
                  )}
                  <footer className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={name} className="size-9" />
                      <div>
                        <p className="font-heading text-sm font-semibold text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{service}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={cn("size-3", index < rating && "fill-current")}
                        />
                      ))}
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. VIP ADVISORY & ECOSYSTEM CALL TO ACTION */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card p-8 sm:p-12 md:p-16 shadow-2xl">
            {/* Ambient Background Glows */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -bottom-24 size-96 rounded-full bg-amber-500/10 blur-3xl"
            />

            <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span>Join The YBDC Network</span>
                </div>
                <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
                  List Your Property or Explore Our Services.
                </h2>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
                  Property listings and related home, finance, and business services across India.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="rounded-xl font-medium shadow-sm transition-transform active:scale-95" asChild>
                  <Link href="/owner" className="flex items-center gap-2">
                    <span>List a Property Direct</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl border-border bg-background hover:bg-accent font-medium text-foreground transition-transform active:scale-95" asChild>
                  <Link href="/register-vendor">
                    Register as Partner
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
