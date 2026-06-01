import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
        <Button variant="ghost" size="sm" asChild className="mb-8 -ml-2 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>

        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          About Us
        </h1>

        <section className="mt-8 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">Welcome to Find My Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            At Find My Property, we are committed to transforming the real estate experience through transparency, professionalism, and innovation. Our mission is to connect property buyers, sellers, investors, and developers with the right opportunities while delivering reliable information and exceptional service.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We specialize in residential, commercial, agricultural, and investment properties, helping clients make informed decisions with confidence. Whether you are searching for your dream home, investing in land, selling a property, or exploring development opportunities, our platform provides a seamless and trusted experience.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">
            To become one of the most trusted and technology-driven real estate platforms, empowering individuals and businesses to achieve their property goals through transparency and excellence.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">Our Mission</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Deliver accurate and verified property information.</li>
            <li>Simplify property discovery and transactions.</li>
            <li>Create value for buyers, sellers, agents, and developers.</li>
            <li>Promote ethical and professional real estate practices.</li>
            <li>Leverage technology to improve customer experience.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">Why Choose Us</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Verified Property Listings</li>
            <li>Transparent Information</li>
            <li>Professional Support</li>
            <li>User-Friendly Platform</li>
            <li>Secure Communication</li>
            <li>Market Insights and Guidance</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">Our Commitment</h2>
          <p className="text-muted-foreground leading-relaxed">
            We believe that every property transaction is a significant milestone. Our team is dedicated to providing trustworthy information, professional guidance, and a secure platform that helps users make confident real estate decisions.
          </p>
        </section>
      </div>
    </main>
  );
}

