import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, Building2, CheckCircle, Eye, FileCheck, Handshake, Shield, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "About Us",
    description: `Learn about ${siteName} — our vision, mission, and commitment to transforming real estate through transparency and innovation.`,
    openGraph: {
      title: `About Us | ${siteName}`,
      description: `Welcome to ${siteName}. Discover our mission to connect buyers, sellers, and developers with verified property opportunities.`,
    },
    alternates: {
      canonical: "/about",
    },
  };
}

export default async function AboutPage() {
  return (
    <main className="pb-20 pt-24">
      <div className="container mx-auto max-w-3xl px-4">
        <Button variant="ghost" size="sm" asChild className="mb-12 -ml-2 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        {/* Main heading */}
        <h1 className="mb-14 font-heading text-5xl font-bold tracking-tight text-foreground md:text-6xl">
          About Us
        </h1>

        {/* Welcome section */}
        <section className="mb-16">
          <h2 className="mb-5 font-heading text-2xl font-semibold text-foreground">Welcome to Find My Property</h2>
          <div className="space-y-4 border-l-2 border-primary/30 pl-6 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              At Find My Property, we are committed to transforming the real estate experience through transparency, professionalism, and innovation. Our mission is to connect property buyers, sellers, investors, and developers with the right opportunities while delivering reliable information and exceptional service.
            </p>
            <p>
              We specialize in residential, commercial, agricultural, and investment properties, helping clients make informed decisions with confidence. Whether you are searching for your dream home, investing in land, selling a property, or exploring development opportunities, our platform provides a seamless and trusted experience.
            </p>
          </div>
        </section>

        {/* Vision section */}
        <section className="mb-16">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-foreground">Our Vision</h2>
          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 to-primary/3 p-6 md:p-8">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              To become one of the most trusted and technology-driven real estate platforms, empowering individuals and businesses to achieve their property goals through transparency and excellence.
            </p>
          </div>
        </section>

        {/* Mission section */}
        <section className="mb-16">
          <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">Our Mission</h2>
          <ul className="space-y-4">
            {[
              "Deliver accurate and verified property information.",
              "Simplify property discovery and transactions.",
              "Create value for buyers, sellers, agents, and developers.",
              "Promote ethical and professional real estate practices.",
              "Leverage technology to improve customer experience.",
            ].map((item, index) => (
              <li key={index} className="flex gap-4 text-[15px] leading-relaxed text-foreground">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Why Choose Us section */}
        <section className="mb-16">
          <h2 className="mb-8 font-heading text-2xl font-semibold text-foreground">Why Choose Us</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              { icon: CheckCircle, text: "Verified Property Listings" },
              { icon: Eye, text: "Transparent Information" },
              { icon: Handshake, text: "Professional Support" },
              { icon: Award, text: "User-Friendly Platform" },
              { icon: Shield, text: "Secure Communication" },
              { icon: Target, text: "Market Insights and Guidance" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex gap-4">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-[15px] leading-relaxed text-foreground">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Commitment section */}
        <section>
          <h2 className="mb-5 font-heading text-2xl font-semibold text-foreground">Our Commitment</h2>
          <div className="rounded-xl border border-border/50 bg-card/40 p-6 md:p-8">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              We believe that every property transaction is a significant milestone. Our team is dedicated to providing trustworthy information, professional guidance, and a secure platform that helps users make confident real estate decisions.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

