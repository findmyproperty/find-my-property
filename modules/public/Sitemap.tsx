"use client";

import Link from "next/link";
import { Building2, Users, UserCircle, LayoutDashboard, FileText, Sparkles, Shield } from "lucide-react";
import { tenantNav, agentNav, adminNav, type NavItem } from "@/config/roleNav";

interface Section {
  title: string;
  links: { href: string; label: string }[];
}

/** Map the canonical sidebar nav (role-aware source of truth) into sitemap rows
 *  so we don't drift when routes are added or renamed in `config/roleNav.tsx`. */
const navToLinks = (items: NavItem[]) =>
  items.map((i) => ({ href: i.url, label: i.title }));

const sections: Section[] = [
  {
    title: "Main",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/browse", label: "Browse listings" },
    ],
  },
  {
    title: "Services",
    links: [
      { href: "/packers-movers", label: "Packers & Movers" },
      { href: "/painting-cleaning", label: "Painting & Cleaning" },
      { href: "/home-services", label: "Home Services" },
      { href: "/event-management", label: "Event Management" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log In" },
      { href: "/register", label: "Sign Up" },
    ],
  },
  { title: "Tenant", links: navToLinks(tenantNav) },
  { title: "Agent", links: navToLinks(agentNav) },
  { title: "Admin", links: navToLinks(adminNav) },
];

const iconBySection: Record<string, React.ElementType> = {
  Main: Building2,
  Services: Sparkles,
  Account: UserCircle,
  Tenant: LayoutDashboard,
  Agent: Users,
  Admin: Shield,
};

const Sitemap = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* <Navbar /> */}
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Sitemap</h1>
            </div>
            <p className="text-muted-foreground mb-10">
              All main pages and sections of the site. Property detail pages are available from the property listing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {sections.map((section) => {
                const Icon = iconBySection[section.title] ?? FileText;
                return (
                  <div
                    key={section.title}
                    className="bg-card border border-border rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                      <h2 className="font-heading font-semibold text-foreground text-lg">
                        {section.title}
                      </h2>
                    </div>
                    <ul className="space-y-2">
                      {section.links.map((link) => (
                        <li key={link.href + link.label}>
                          <Link
                            href={link.href}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors break-words"
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

            <div className="mt-10 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Individual property pages (e.g. /property/3BHK-house-1) are
                linked from the{" "}
                <Link href="/browse" className="text-primary hover:underline">
                  Browse listings
                </Link>{" "}
                page. For search engines, see{" "}
                <a href="/sitemap.xml" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  sitemap.xml
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      {/* <Footer /> */}
    </div>
  );
};

export default Sitemap;
