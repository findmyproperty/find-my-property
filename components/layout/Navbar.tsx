"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Building2, LogOut, ChevronDown, Truck, PaintBucket, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { UserAvatar } from "@/components/user-avatar";
import ThemeToggle from "@/components/ThemeToggle";
import { SITE_NAME } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";
import { NavLoginRegisterLinks } from "@/components/layout/nav-login-register-links";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { settings } = useSettings();

  // Admin-configured branding with sensible fallbacks so the navbar never
  // renders blank while the settings query is in-flight or offline.
  const siteName = settings?.siteName?.trim() || SITE_NAME;
  const logoUrl = settings?.primaryLogoUrl?.trim() || null;

  const getDashboardLink = () => {
    if (!user) return "/login";
    return "/dashboard";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 min-w-0">
        <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {logoUrl ? (
              <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                <Image
                  src={logoUrl}
                  alt={siteName}
                  fill
                  sizes="36px"
                  unoptimized
                  className="object-contain"
                />
              </span>
            ) : (
              <div className="w-9 h-9 rounded-lg hero-gradient flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <span className="font-heading font-bold text-xl text-foreground">
              {siteName}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none">
                Services
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem asChild>
                  <Link href="/packers-movers" className="flex items-start gap-3">
                    <Truck className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                    <div className="leading-tight">
                      <p className="font-medium text-foreground">Packers &amp; Movers</p>
                      <p className="text-xs text-muted-foreground">
                        Verified crews, transparent pricing
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/painting-cleaning" className="flex items-start gap-3">
                    <PaintBucket className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                    <div className="leading-tight">
                      <p className="font-medium text-foreground">Painting &amp; Cleaning</p>
                      <p className="text-xs text-muted-foreground">
                        Painting, cleaning & basic repairs
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/event-management" className="flex items-start gap-3">
                    <PartyPopper className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                    <div className="leading-tight">
                      <p className="font-medium text-foreground">Event Management</p>
                      <p className="text-xs text-muted-foreground">
                        Birthdays, weddings & corporate
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
              Contact
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3 min-w-0 shrink-0">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={getDashboardLink()} className="flex items-center gap-2 min-w-0">
                  <UserAvatar
                    name={user?.name ?? "User"}
                    avatarUrl={user?.avatarUrl}
                    className="h-6 w-6"
                    fallbackClassName="text-[10px]"
                  />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                   logout().then(() => {
                    router.refresh();
                   });
                }}
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <Suspense
              fallback={
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>
              }
            >
              <NavLoginRegisterLinks />
            </Suspense>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-b border-border overflow-hidden"
          >
            <div className="px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-heading text-sm font-semibold text-foreground">{siteName}</span>
                <ThemeToggle className="h-9 w-9" />
              </div>
              <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                  Services
                </p>
                <Link
                  href="/packers-movers"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  <Truck className="h-4 w-4 text-primary" aria-hidden />
                  Packers &amp; Movers
                </Link>
                <Link
                  href="/painting-cleaning"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  <PaintBucket className="h-4 w-4 text-primary" aria-hidden />
                  Painting &amp; Cleaning
                </Link>
                <Link
                  href="/event-management"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  <PartyPopper className="h-4 w-4 text-primary" aria-hidden />
                  Event Management
                </Link>
                <div className="mt-1 border-t border-border pt-3 flex flex-col gap-2">
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    Contact
                  </Link>
                </div>
              </div>
              <div className="flex gap-2">
                {isAuthenticated ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={getDashboardLink()} onClick={() => setMobileOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        logout().then(() => {
                          router.refresh();
                        });
                        setMobileOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <Suspense
                    fallback={
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href="/login" onClick={() => setMobileOpen(false)}>
                            Log In
                          </Link>
                        </Button>
                        <Button size="sm" className="flex-1" asChild>
                          <Link href="/register" onClick={() => setMobileOpen(false)}>
                            Sign Up
                          </Link>
                        </Button>
                      </div>
                    }
                  >
                    <NavLoginRegisterLinks
                      className="w-full"
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </Suspense>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
