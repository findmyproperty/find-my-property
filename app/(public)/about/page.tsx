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
  SearchCheck,
  Users,
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
    description: `Learn how ${siteName} connects property discovery with practical home, lifestyle, finance, and professional services on one platform.`,
    openGraph: {
      title: `About ${siteName}`,
      description: `Property discovery and trusted everyday services, brought into one connected customer journey.`,
    },
    alternates: {
      canonical: "/about",
    },
  };
}

const values = [
  {
    icon: SearchCheck,
    title: "Clarity before action",
    description:
      "We organise listings and service requests around useful details so people can make better-informed choices.",
  },
  {
    icon: BadgeCheck,
    title: "Trust through process",
    description:
      "Verification, structured information, and account-based activity help reduce noise and confusion.",
  },
  {
    icon: Scale,
    title: "A fair platform",
    description:
      "Customers, owners, agents, and vendors should understand what the platform does and where their responsibility begins.",
  },
];

export default async function AboutPage() {
  const { siteName } = await getBranding();

  return (
    <main className="pb-20 pt-24">
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

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <Badge variant="outline" className="text-primary">
                About {siteName}
              </Badge>
              <h1 className="mt-6 max-w-4xl font-heading text-5xl font-bold leading-[1.03] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
                Property is the beginning.
                <span className="mt-2 block text-primary">Life around it is the journey.</span>
              </h1>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {siteName} is evolving from a real estate destination into a connected
              platform for property, home, lifestyle, finance, and professional needs.
              Our aim is simple: make the next useful step easier to find.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container mx-auto max-w-300 px-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="p-7 md:p-10">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Building2 className="size-6" aria-hidden />
                </span>
                <CardDescription className="pt-7 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Real estate foundation
                </CardDescription>
                <CardTitle className="font-heading text-3xl leading-tight">
                  Helping people find, list, and understand property opportunities.
                </CardTitle>
              </CardHeader>
              <CardContent className="px-7 md:px-10">
                <p className="leading-7 text-muted-foreground">
                  The platform supports buyers, tenants, owners, agents, and administrators
                  with property discovery, listing details, direct enquiries, and account
                  tools that keep activity organised.
                </p>
              </CardContent>
              <CardFooter className="p-7 pt-3 md:p-10 md:pt-4">
                <Button variant="outline" asChild>
                  <Link href="/browse">
                    Browse properties
                    <ArrowRight data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="p-7 md:p-10">
                <span className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
                  <HandHelping className="size-6" aria-hidden />
                </span>
                <CardDescription className="pt-7 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Expanding service network
                </CardDescription>
                <CardTitle className="font-heading text-3xl leading-tight">
                  Connecting customers with practical support beyond the transaction.
                </CardTitle>
              </CardHeader>
              <CardContent className="px-7 md:px-10">
                <p className="leading-7 text-muted-foreground">
                  Moving, cleaning, repairs, event support, IT assistance, loans, general
                  help, and job consultancy now sit alongside property—because those needs
                  often form one continuous journey.
                </p>
              </CardContent>
              <CardFooter className="p-7 pt-3 md:p-10 md:pt-4">
                <Button asChild>
                  <Link href="/#services">
                    Explore services
                    <ArrowRight data-icon="inline-end" aria-hidden />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/25 py-20 sm:py-24">
        <div className="container mx-auto grid max-w-[1200px] gap-12 px-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Our direction
            </p>
            <h2 className="mt-5 font-heading text-4xl font-bold tracking-tight text-foreground">
              One platform, many important moments.
            </h2>
            <p className="mt-5 leading-7 text-muted-foreground">
              We are not trying to make every service look the same. We are creating a
              consistent way to discover the right category, share a clear requirement,
              and continue the conversation with the relevant people.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <CardTitle className="pt-5 font-heading text-xl leading-tight">{title}</CardTitle>
                  <CardDescription className="leading-6">{description}</CardDescription>
                </CardHeader>
                <CardContent />
                <CardFooter />
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Who the platform serves
              </p>
              <h2 className="mt-5 max-w-2xl font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Better outcomes need the right people on both sides.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Customers need clarity and choice. Owners and agents need serious
                enquiries. Vendors need relevant opportunities. {siteName} is designed to
                support those roles without losing sight of accountability.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                { icon: Users, text: "Customers searching for property or services" },
                { icon: Building2, text: "Owners and agents presenting property opportunities" },
                { icon: Network, text: "Service vendors responding to relevant customer needs" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="font-medium text-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-[1200px] px-4">
        <div className="rounded-[2rem] bg-primary p-8 text-primary-foreground sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
            Move forward with us
          </p>
          <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl font-heading text-4xl font-bold tracking-tight md:text-5xl">
              Start with a property. Continue with everything you need around it.
            </h2>
            <Button size="lg" variant="secondary" asChild className="shrink-0">
              <Link href="/">
                Explore {siteName}
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
