"use client";

import { Building2, Heart, Phone, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";

const Footer = () => {
  const { settings } = useSettings();

  // Fall back to compile-time branding constants so the footer still renders
  // correctly during the initial client-side settings fetch and in contexts
  // where the settings API is unreachable (e.g. offline static renders).
  const siteName = settings?.siteName?.trim() || SITE_NAME;
  const email = settings?.supportEmail?.trim() || SUPPORT_EMAIL;
  const phone = settings?.supportPhone?.trim() || null;
  const logoUrl = settings?.primaryLogoUrl?.trim() || null;
  // Hardcoded: Next 16's prerender checker rejects `new Date()` in Client
  // Components (non-deterministic at build time). Copyright years don't need
  // to be live — bump this annually.
  const year = 2026;

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                <span className="relative inline-flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden">
                  <Image
                    src={logoUrl}
                    alt={siteName}
                    fill
                    sizes="128px"
                    unoptimized
                    className="object-contain"
                  />
                </span>
              ) : (
                <div className="hero-gradient flex size-14 shrink-0 items-center justify-center rounded-xl">
                  <Building2 className="size-7 text-primary-foreground" />
                </div>
              )}
              <span className="min-w-0 font-heading text-xl font-bold text-foreground">
                {siteName}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs wrap-break-word">
              Find property and request practical services for moving, home, work, finance, and everyday life.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><Link href="/browse" className="hover:text-primary transition-colors">Browse listings</Link></li>
              <li><Link href="/owner" className="hover:text-primary transition-colors">List a property</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading font-semibold text-foreground">Popular Services</h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><Link href="/packers-movers" className="transition-colors hover:text-primary">Packers &amp; movers</Link></li>
              <li><Link href="/painting-cleaning" className="transition-colors hover:text-primary">Painting &amp; cleaning</Link></li>
              <li><Link href="/home-services" className="transition-colors hover:text-primary">Home services</Link></li>
              <li><Link href="/loans" className="transition-colors hover:text-primary">Loan assistance</Link></li>
              <li><Link href="/#services" className="transition-colors hover:text-primary">View all services</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">Contact</h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground wrap-break-word">
              {phone ? (
                <li className="flex items-center gap-2 min-w-0">
                  <Phone className="size-4 shrink-0" />
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="min-w-0 break-all hover:text-primary transition-colors"
                  >
                    {phone}
                  </a>
                </li>
              ) : null}
              <li className="flex items-center gap-2 min-w-0">
                <Mail className="size-4 shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="min-w-0 break-all hover:text-primary transition-colors"
                >
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© {year} {siteName}. All rights reserved.</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-accent" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
