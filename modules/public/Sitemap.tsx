"use client";

import Link from "next/link";
import { Building2, UserCircle, FileText, Sparkles, Landmark } from "lucide-react";

interface Section {
  title: string;
  links: { href: string; label: string }[];
}

/** Public-only sitemap — never list role dashboards (admin/agent/tenant). */
const sections: Section[] = [
  {
    title: "Main",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/browse", label: "Browse listings" },
      { href: "/owner", label: "List your property" },
      { href: "/terms-and-conditions", label: "Terms & conditions" },
    ],
  },
  {
    title: "Services",
    links: [
      { href: "/packers-movers", label: "Packers & Movers" },
      { href: "/painting-cleaning", label: "Painting & Cleaning" },
      { href: "/home-services", label: "Home Services" },
      { href: "/event-management", label: "Event Management" },
      { href: "/it-services", label: "IT Services" },
      { href: "/general-services", label: "General Services" },
      { href: "/loans", label: "Loans" },
      { href: "/job-consultancy", label: "Job consultancy" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log In" },
      { href: "/register", label: "Sign Up" },
    ],
  },
];

const iconBySection: Record<string, React.ElementType> = {
  Main: Building2,
  Services: Sparkles,
  Account: UserCircle,
  Finance: Landmark,
};

const Sitemap = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <main className="pb-20 pt-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Sitemap</h1>
            </div>
            <p className="mb-10 text-muted-foreground">
              Public pages on this site. Property detail pages are linked from Browse listings.
            </p>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((section) => {
                const Icon = iconBySection[section.title] ?? FileText;
                return (
                  <div
                    key={section.title}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                      <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
                        {section.title}
                      </h2>
                    </div>
                    <ul className="space-y-2">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sitemap;
