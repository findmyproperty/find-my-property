import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  HandHelping,
  Network,
  Scale,
  Users,
  Compass,
} from "lucide-react";

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
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "About Us",
    description: `Learn how ${siteName} connects customers with verified service providers across financial and professional services through a transparent process.`,
    openGraph: {
      title: `About ${siteName}`,
      description: `${siteName} – Yashas Business Development & Consultancy is a trusted business development and consultancy platform.`,
    },
    alternates: {
      canonical: "/about",
    },
  };
}

export default async function AboutPage() {
  const { siteName } = await getBranding();

  const missionItems = [
    {
      icon: BadgeCheck,
      title: "Verify before we connect",
      description: `Every partner on ${siteName} goes through a transparent verification process before being recommended to a customer.`,
    },
    {
      icon: Scale,
      title: "Simplify complex decisions",
      description: "Make loans, real estate, and professional services easier to navigate with clear guidance at every step.",
    },
    {
      icon: HandHelping,
      title: "Support end-to-end",
      description: "Stay with the customer from first inquiry to service completion, not just the handoff.",
    },
    {
      icon: Network,
      title: "Grow our partners",
      description: "Help verified businesses scale through quality leads and long-term customer relationships.",
    },
    {
      icon: Users,
      title: "Build lasting trust",
      description: "Operate with the transparency and accountability that turns one-time users into repeat customers and advocates.",
    },
  ];

  return (
    <main className="pb-20 pt-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_18%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_30%),linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--muted)_30%,var(--background)))]"
        />
        <div className="container mx-auto max-w-300 px-4 py-14 sm:py-20">
          <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
            <Link href="/">
              <ArrowLeft data-icon="inline-start" aria-hidden />
              Back to home
            </Link>
          </Button>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <Badge variant="outline" className="text-primary mb-4">
                About {siteName}
              </Badge>
              <h1 className="max-w-4xl font-heading text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
                {siteName} – Yashas Business
                <span className="mt-2 block text-primary">Development & Consultancy</span>
              </h1>
              <p className="mt-4 font-heading text-lg font-medium text-muted-foreground/80 tracking-wide">
                One Platform. Multiple Solutions. Infinite Opportunities.
              </p>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {siteName} is a trusted business development and consultancy platform committed
              to connecting customers with verified service providers through a transparent and
              professional process. We believe in building trust and quality leads.
            </p>
          </div>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto max-w-300 px-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="p-7 md:p-10">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Building2 className="size-6" aria-hidden />
                </span>
                <CardDescription className="pt-7 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Comprehensive Offerings
                </CardDescription>
                <CardTitle className="font-heading text-3xl leading-tight">
                  We offer A-Z services for personal and business needs.
                </CardTitle>
              </CardHeader>
              <CardContent className="px-7 md:px-10">
                <p className="leading-7 text-muted-foreground">
                  Spanning personal loans, home loans, business loans, real estate, and a growing
                  network of professional services, and beyond. We connect genuine customers with
                  trusted businesses while helping partners grow.
                </p>
              </CardContent>
              <CardFooter className="p-7 pt-3 md:p-10 md:pt-4">
                <Button variant="outline" asChild>
                  <Link href="/#services">
                    Browse services
                    <ArrowRight data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="p-7 md:p-10">
                <span className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
                  <Compass className="size-6" aria-hidden />
                </span>
                <CardDescription className="pt-7 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Our core focus
                </CardDescription>
                <CardTitle className="font-heading text-3xl leading-tight">
                  Building trust, creating opportunities, and supporting customers.
                </CardTitle>
              </CardHeader>
              <CardContent className="px-7 md:px-10">
                <p className="leading-7 text-muted-foreground">
                  Our focus is on delivering reliable customer support from inquiry to service
                  completion, ensuring verification and long-term customer relationships so you
                  can proceed with full confidence.
                </p>
              </CardContent>
              <CardFooter className="p-7 pt-3 md:p-10 md:pt-4">
                <Button asChild>
                  <Link href="/register-vendor">
                    Join as partner
                    <ArrowRight data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision & Direction Section */}
      <section className="border-y border-border bg-muted/25 py-20 sm:py-24">
        <div className="container mx-auto max-w-300 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="text-primary mb-4">
              Our Vision
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl leading-tight">
              To become India&apos;s most trusted business development and consultancy platform.
            </h2>
            <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
              Where every customer confidently connects with verified, credible service providers
              across financial and professional services.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="text-primary mb-3">
              Our Mission
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              The principles that guide our work
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center">
            {missionItems.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="flex flex-col justify-between">
                <CardHeader>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <CardTitle className="pt-5 font-heading text-xl leading-tight">{title}</CardTitle>
                  <CardDescription className="leading-6 mt-2">{description}</CardDescription>
                </CardHeader>
                <CardContent />
                <CardFooter />
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
