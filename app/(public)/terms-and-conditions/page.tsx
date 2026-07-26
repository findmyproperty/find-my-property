import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Mail, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPPORT_EMAIL } from "@/lib/branding";
import { getBranding } from "@/lib/branding/server";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getBranding();
  return {
    title: "Terms & Conditions",
    description: `Read the terms governing property listings, service requests, vendor interactions, accounts, and other features available through ${siteName}.`,
    openGraph: {
      title: `Terms & Conditions | ${siteName}`,
      description: `Terms for property discovery, service requests, vendors, and related platform features on ${siteName}.`,
    },
    alternates: {
      canonical: "/terms-and-conditions",
    },
  };
}

type TermsSection = {
  id: string;
  title: string;
  content: ReactNode;
};

export default async function TermsAndConditionsPage() {
  const { siteName } = await getBranding();

  const sections: TermsSection[] = [
    {
      id: "acceptance",
      title: "1. Acceptance and eligibility",
      content: (
        <>
          <p>
            By accessing or using {siteName}, you confirm that you have read, understood,
            and agreed to these Terms. If you do not agree, you must stop using the
            platform.
          </p>
          <p>
            You must be at least 18 years old and legally capable of entering into a
            binding agreement. If you use the platform for a business or organisation, you
            confirm that you are authorised to accept these Terms on its behalf.
          </p>
        </>
      ),
    },
    {
      id: "platform-role",
      title: "2. Platform purpose and role",
      content: (
        <>
          <p>
            {siteName} provides technology for property discovery and listings, customer
            enquiries, service requests, vendor discovery, loan assistance, job
            consultancy, and related account features.
          </p>
          <p>
            Unless expressly stated otherwise, {siteName} acts as a technology and
            facilitation platform. We are not automatically a party to an agreement
            between a customer and an owner, agent, vendor, lender, employer, recruiter, or
            other third party.
          </p>
        </>
      ),
    },
    {
      id: "accounts",
      title: "3. Accounts and information",
      content: (
        <>
          <p>
            You are responsible for providing accurate, current information and for
            protecting access to your account, login credentials, and verification codes.
            Activity completed through your account may be treated as authorised by you.
          </p>
          <p>
            You must promptly update information that becomes incorrect and notify us if
            you suspect unauthorised access or misuse.
          </p>
        </>
      ),
    },
    {
      id: "property-listings",
      title: "4. Property listings and enquiries",
      content: (
        <>
          <p>
            Property descriptions, prices, availability, ownership claims, approvals,
            measurements, photographs, amenities, and location details may be supplied by
            owners, agents, developers, or other users. Although we may review or moderate
            listings, we do not guarantee that every detail is complete, accurate,
            current, or suitable for your needs.
          </p>
          <p>
            Users must independently verify title, ownership, documentation, approvals,
            condition, pricing, and transaction terms and should obtain appropriate legal,
            technical, or financial advice before making a decision.
          </p>
        </>
      ),
    },
    {
      id: "services-and-vendors",
      title: "5. Services and vendors",
      content: (
        <>
          <p>
            The platform may help users discover or request services including moving,
            painting, cleaning, repairs, event management, IT support, general assistance,
            and other categories made available from time to time.
          </p>
          <p>
            Vendors are independent service providers unless explicitly identified as our
            employees or representatives. Verification labels, profile reviews, or
            onboarding checks are informational controls and do not guarantee a
            provider&apos;s quality, availability, licensing, conduct, or outcome.
          </p>
          <p>
            Customers should confirm the provider&apos;s identity, scope, pricing,
            materials, schedule, insurance, licences, and any warranty before work begins.
          </p>
        </>
      ),
    },
    {
      id: "service-requests",
      title: "6. Service requests, quotes, and fulfilment",
      content: (
        <>
          <p>
            Submitting a request does not guarantee acceptance, assignment, pricing,
            availability, or completion. A request becomes a service arrangement only when
            the relevant parties agree to its scope and terms.
          </p>
          <p>
            Estimates may change after inspection or when requirements change. Customers
            must provide safe access and accurate details. Vendors must perform accepted
            work lawfully, professionally, and in accordance with the agreed scope.
          </p>
          <p>
            Any cancellation, rescheduling, refund, rework, or warranty terms communicated
            for a particular service will apply in addition to these Terms.
          </p>
        </>
      ),
    },
    {
      id: "finance-and-careers",
      title: "7. Loan assistance and job consultancy",
      content: (
        <>
          <p>
            Loan-related features facilitate enquiries and introductions only. Approval,
            eligibility, interest rates, fees, documentation, disbursal, and repayment
            terms are determined by the relevant lender or financial institution.
            Information on the platform is not financial or investment advice.
          </p>
          <p>
            Job consultancy features may support candidate and employer introductions but
            do not guarantee an interview, offer, salary, placement, candidate quality, or
            continued employment. Users must independently verify employers, candidates,
            roles, and contractual terms.
          </p>
        </>
      ),
    },
    {
      id: "pricing-payments",
      title: "8. Pricing, payments, and platform charges",
      content: (
        <>
          <p>
            Prices, commissions, lead charges, service fees, taxes, wallet entries, or
            other amounts—where applicable—will be shown or communicated through the
            relevant feature. You agree to review the total amount and applicable terms
            before confirming a paid transaction.
          </p>
          <p>
            Payments may be processed by third-party payment providers and may be subject
            to their terms. Except where required by law or expressly stated for a
            transaction, charges are not automatically refundable.
          </p>
        </>
      ),
    },
    {
      id: "user-conduct",
      title: "9. User and vendor conduct",
      content: (
        <>
          <p>You must not:</p>
          <ul>
            <li>provide false, deceptive, impersonated, or unlawfully obtained information;</li>
            <li>post content or listings you are not authorised to publish;</li>
            <li>harass users, misuse contact details, send spam, or bypass platform safeguards;</li>
            <li>upload malicious code or interfere with platform security or availability;</li>
            <li>use the platform for unlawful, discriminatory, fraudulent, or harmful activity;</li>
            <li>scrape, reproduce, resell, or exploit platform data without written permission.</li>
          </ul>
        </>
      ),
    },
    {
      id: "communications",
      title: "10. Communications and consent",
      content: (
        <p>
          When you submit an enquiry or service request, you authorise {siteName} and
          relevant owners, agents, vendors, lenders, recruiters, or service partners to
          contact you about that request using the details you provide, subject to
          applicable law. You may manage promotional preferences separately, but essential
          transactional communications may still be sent.
        </p>
      ),
    },
    {
      id: "content",
      title: "11. User content and intellectual property",
      content: (
        <>
          <p>
            You retain responsibility for content you submit. You grant {siteName} a
            non-exclusive, worldwide, royalty-free licence to host, reproduce, format,
            display, and distribute that content as reasonably necessary to operate,
            promote, secure, and improve the platform.
          </p>
          <p>
            The platform&apos;s software, design, branding, text, and original materials
            are owned by or licensed to {siteName} and are protected by applicable
            intellectual-property laws.
          </p>
        </>
      ),
    },
    {
      id: "third-parties",
      title: "12. Third-party services and links",
      content: (
        <p>
          The platform may integrate maps, cloud storage, communications, payments, social
          login, or external websites. Third parties control their own services, terms,
          availability, and privacy practices. We are not responsible for third-party
          systems beyond the extent required by applicable law.
        </p>
      ),
    },
    {
      id: "availability",
      title: "13. Availability and changes to the platform",
      content: (
        <p>
          We may add, modify, suspend, or discontinue features, categories, listings, or
          accounts to maintain security, comply with law, improve the platform, or address
          operational needs. We do not guarantee uninterrupted or error-free availability.
        </p>
      ),
    },
    {
      id: "liability",
      title: "14. Disclaimers and limitation of liability",
      content: (
        <>
          <p>
            The platform is provided on an “as available” basis. To the maximum extent
            permitted by law, {siteName} disclaims implied warranties regarding
            merchantability, fitness for a particular purpose, accuracy, and
            non-infringement.
          </p>
          <p>
            To the maximum extent permitted by law, {siteName} and its directors,
            employees, affiliates, and partners will not be liable for indirect,
            incidental, special, consequential, or punitive loss arising from platform
            use, property decisions, service-provider conduct, third-party transactions,
            data supplied by users, or service interruptions.
          </p>
          <p>
            Nothing in these Terms excludes liability that cannot legally be excluded or
            limits consumer rights that cannot legally be waived.
          </p>
        </>
      ),
    },
    {
      id: "indemnity",
      title: "15. Indemnity",
      content: (
        <p>
          To the extent permitted by law, you agree to indemnify {siteName}, its
          affiliates, directors, employees, and partners against claims, losses, and
          reasonable costs arising from your unlawful use of the platform, your content,
          your services, your breach of these Terms, or your infringement of another
          person&apos;s rights.
        </p>
      ),
    },
    {
      id: "suspension",
      title: "16. Suspension and termination",
      content: (
        <p>
          We may restrict, suspend, or terminate access when we reasonably believe an
          account has violated these Terms, created risk for users or the platform, failed
          required verification, or must be restricted to comply with law. Provisions
          intended to survive termination—including intellectual property, liability, and
          dispute provisions—will continue to apply.
        </p>
      ),
    },
    {
      id: "changes",
      title: "17. Changes to these Terms",
      content: (
        <p>
          We may update these Terms as the platform, services, or law changes. The revised
          version will be posted with an updated date. Continued use after an update takes
          effect constitutes acceptance of the revised Terms where permitted by law.
        </p>
      ),
    },
    {
      id: "law-contact",
      title: "18. Governing law and contact",
      content: (
        <>
          <p>
            These Terms are governed by the laws of India. Subject to any mandatory
            consumer forum or jurisdiction, disputes will be subject to the courts in
            Chennai, Tamil Nadu.
          </p>
          <p>
            Questions about these Terms can be sent to{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </>
      ),
    },
  ];

  return (
    <main className="pb-20 pt-24">
      <section className="border-b border-border bg-muted/25">
        <div className="container mx-auto max-w-[1200px] px-4 py-14 sm:py-20">
          <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
            <Link href="/">
              <ArrowLeft data-icon="inline-start" aria-hidden />
              Back to home
            </Link>
          </Button>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <Badge variant="outline" className="text-primary">
                <FileText data-icon="inline-start" aria-hidden />
                Legal
              </Badge>
              <h1 className="mt-6 font-heading text-5xl font-bold tracking-[-0.04em] text-foreground sm:text-6xl">
                Terms &amp; Conditions
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                The rules for using {siteName} across property listings, service requests,
                vendor interactions, finance and career assistance, and account features.
              </p>
            </div>
            <div className="lg:text-right">
              <p className="text-sm font-medium text-foreground">Last updated</p>
              <p className="mt-1 text-sm text-muted-foreground">26 July 2026</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto grid max-w-[1200px] gap-12 px-4 py-14 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-20">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">On this page</CardTitle>
            </CardHeader>
            <CardContent>
              <nav aria-label="Terms sections">
                <ol className="flex flex-col gap-2">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block text-sm leading-5 text-muted-foreground transition-colors hover:text-primary"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </CardContent>
          </Card>
        </aside>

        <article className="min-w-0">
          <div className="mb-10 flex gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm leading-6 text-muted-foreground">
              These Terms apply to all users, including property seekers, owners, agents,
              vendors, customers, employers, candidates, and visitors.
            </p>
          </div>

          <div className="flex flex-col gap-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-32">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                  {section.title}
                </h2>
                <div className="mt-4 flex flex-col gap-4 text-[15px] leading-7 text-muted-foreground [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <Card className="mt-14">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-xl">
                <Mail className="size-5 text-primary" aria-hidden />
                Questions about these Terms?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Contact {siteName} at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </article>
      </div>
    </main>
  );
}
