"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Building2,
  LogOut,
  ChevronDown,
  Truck,
  PaintBucket,
  PartyPopper,
  Wrench,
  Monitor,
  HandHelping,
  LayoutDashboard,
  UserCircle,
  ClipboardList,
  Search,
  Bell,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth, type UserRole } from "@/contexts/auth-context";
import { UserAvatar } from "@/components/user-avatar";
import ThemeToggle from "@/components/ThemeToggle";
import { SITE_NAME } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";
import { NavLoginRegisterLinks } from "@/components/layout/nav-login-register-links";
import { MobileNavAutoClose } from "@/components/layout/mobile-nav-auto-close";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ServiceMenuItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type ProfileMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const homeServices = [
  {
    href: "/packers-movers",
    label: "Packers & Movers",
    description: "Verified shifting crews with transparent pricing.",
    icon: Truck,
  },
  {
    href: "/painting-cleaning",
    label: "Painting & Cleaning",
    description: "Fresh paintwork and deep cleaning for move-in homes.",
    icon: PaintBucket,
  },
  {
    href: "/home-services",
    label: "Home Services",
    description: "Carpenters, plumbers, electricians, and repairs.",
    icon: Wrench,
  },
];

const businessServices = [
  {
    href: "/loans",
    label: "Loan Assistance",
    description: "Home, mortgage, personal, and commercial loan support.",
    icon: Wallet,
  },
  {
    href: "/it-services",
    label: "IT Services",
    description: "Laptop repair, networking, CCTV, and business tech.",
    icon: Monitor,
  },
  {
    href: "/event-management",
    label: "Event Management",
    description: "Planning support for celebrations and corporate events.",
    icon: PartyPopper,
  },
  {
    href: "/job-consultancy",
    label: "Job Consultancy",
    description: "Career opportunities and verified talent acquisition.",
    icon: Users,
  },
  {
    href: "/general-services",
    label: "General Services",
    description: "Errands, assembly, maintenance, and everyday help.",
    icon: HandHelping,
  },
];

const serviceMenuItems: ServiceMenuItem[] = [...homeServices, ...businessServices];

export function getProfileMenuItems(role: UserRole | undefined): ProfileMenuItem[] {
  const items: ProfileMenuItem[] = [
    { href: "/profile", label: "Edit profile", icon: UserCircle },
    { href: "/browse", label: "Browse properties", icon: Search },
  ];

  if (role === "tenant" || role === "agent" || role === "admin") {
    items.splice(1, 0, {
      href: "/my-requests",
      label: "My requests",
      icon: ClipboardList,
    });
  }

  if (role === "agent") {
    items.push({ href: "/leads", label: "Leads", icon: Users });
  }

  if (role === "vendor") {
    items.push(
      { href: "/leads", label: "My leads", icon: Users },
      { href: "/wallet", label: "Wallet", icon: Wallet },
    );
  }

  if (role === "admin" || role === "vendor") {
    items.push({ href: "/alerts", label: "Alerts", icon: Bell });
  }

  if (role === "admin") {
    items.push({
      href: "/admin/settings",
      label: "Site settings",
      icon: Settings,
    });
  }

  return items;
}

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { settings } = useSettings();

  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHeroTransparent = isHomePage && !isScrolled;

  // Admin-configured branding with sensible fallbacks so the navbar never
  // renders blank while the settings query is in-flight or offline.
  const siteName = settings?.siteName?.trim() || SITE_NAME;
  const logoUrl = settings?.primaryLogoUrl?.trim() || null;

  const getDashboardLink = () => {
    if (!user) return "/login";
    return "/dashboard";
  };

  const handleLogout = () => {
    logout().then(() => {
      router.refresh();
    });
  };

  const profileMenuItems = getProfileMenuItems(user?.role);

  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
        isHeroTransparent
          ? "bg-gradient-to-b from-black/85 via-black/40 to-transparent border-b border-white/10 backdrop-blur-[2px]"
          : "bg-white/85 dark:bg-card/85 backdrop-blur-xl border-b border-border/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]"
      )}
    >
      <div
        className={cn(
          "container mx-auto flex min-w-0 items-center justify-between px-4 transition-all duration-300",
          isHeroTransparent ? "h-20 md:h-22" : "h-16 md:h-18"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
          <Link href="/" className="flex shrink-0 items-center gap-3 group" onClick={closeMobileMenu}>
            {logoUrl ? (
              <span
                className={cn(
                  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl transition-all duration-300",
                  isHeroTransparent
                    ? "h-11 w-20 md:h-12 md:w-24 bg-white/10 p-1 border border-white/20 shadow-sm backdrop-blur-md group-hover:bg-white/15"
                    : "h-10 w-20 md:h-11 md:w-24 bg-black/[0.03] dark:bg-white/5 p-1 border border-black/10 dark:border-white/10 shadow-xs group-hover:border-primary/40"
                )}
              >
                <Image
                  src={logoUrl}
                  alt={siteName}
                  fill
                  sizes="(min-width: 768px) 96px, 80px"
                  unoptimized
                  className="object-contain"
                />
              </span>
            ) : (
              <div className="hero-gradient flex size-10 shrink-0 items-center justify-center rounded-xl md:size-11 shadow-sm">
                <Building2 className="size-5 text-primary-foreground md:size-6" />
              </div>
            )}
            <div className="hidden sm:flex flex-col">
              <span
                className={cn(
                  "font-heading font-bold text-sm tracking-tight leading-tight transition-colors duration-200",
                  isHeroTransparent ? "text-white" : "text-foreground"
                )}
              >
                {siteName}
              </span>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider font-medium transition-colors duration-200",
                  isHeroTransparent ? "text-white/60" : "text-muted-foreground"
                )}
              >
                Real Estate &amp; Advisory
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1.5 text-sm">
            <NavigationMenu>
              <NavigationMenuList className="gap-0">
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "h-auto px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                      isHeroTransparent
                        ? "bg-transparent text-white/85 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[state=open]:bg-white/15 data-[state=open]:text-white"
                        : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    )}
                  >
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[680px] grid-cols-2 gap-4 p-5">
                      <div>
                        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Home &amp; Move-In
                        </p>
                        <div className="space-y-1">
                          {homeServices.map(({ href, label, description, icon: Icon }) => (
                            <NavigationMenuLink key={href} asChild>
                              <Link
                                href={href}
                                className="flex items-start rounded-lg p-2.5 transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
                              >
                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                  <Icon className="size-4" aria-hidden />
                                </span>
                                <span className="ml-3 min-w-0">
                                  <span className="block text-sm font-medium leading-none text-foreground">
                                    {label}
                                  </span>
                                  <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">
                                    {description}
                                  </span>
                                </span>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>

                      <div className="border-l border-border pl-4">
                        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Consultancy &amp; Professional
                        </p>
                        <div className="space-y-1">
                          {businessServices.map(({ href, label, description, icon: Icon }) => (
                            <NavigationMenuLink key={href} asChild>
                              <Link
                                href={href}
                                className="flex items-start rounded-lg p-2.5 transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
                              >
                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                  <Icon className="size-4" aria-hidden />
                                </span>
                                <span className="ml-3 min-w-0">
                                  <span className="block text-sm font-medium leading-none text-foreground">
                                    {label}
                                  </span>
                                  <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">
                                    {description}
                                  </span>
                                </span>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link
              href="/about"
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                isHeroTransparent
                  ? "text-white/85 hover:bg-white/10 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              )}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                isHeroTransparent
                  ? "text-white/85 hover:bg-white/10 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              )}
            >
              Contact
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2.5 min-w-0 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className={cn(
              "size-9 rounded-full transition-all duration-200",
              isHeroTransparent
                ? "text-white hover:bg-white/15 hover:text-white border border-white/15 bg-white/5"
                : "text-foreground hover:bg-muted border border-border/60"
            )}
          >
            <Link href="/browse" aria-label="Search properties">
              <Search className="size-4" />
            </Link>
          </Button>
          <ThemeToggle
            className={cn(
              "transition-all duration-200",
              isHeroTransparent &&
                "!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 hover:!text-white"
            )}
          />
          {isAuthenticated ? (
            <>
              <Button
                variant={isHeroTransparent ? "outline" : "default"}
                size="sm"
                asChild
                className={cn(
                  "rounded-full px-4 h-9 text-xs font-medium transition-all shadow-xs",
                  isHeroTransparent
                    ? "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/40 backdrop-blur-sm"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Link href={getDashboardLink()} className="flex items-center gap-1.5 min-w-0">
                  <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                  <span>Dashboard</span>
                </Link>
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all focus:outline-none",
                    isHeroTransparent
                      ? "text-white hover:bg-white/15 border border-white/15 bg-white/5"
                      : "text-foreground hover:bg-muted border border-border/60"
                  )}
                >
                  <UserAvatar
                    name={user?.name ?? "User"}
                    avatarUrl={user?.avatarUrl}
                    className="h-6 w-6 ring-1 ring-white/20"
                    fallbackClassName="text-[10px]"
                  />
                  <span className="max-w-[100px] truncate">{user?.name ? user.name.split(" ")[0] : "Profile"}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-colors",
                      isHeroTransparent ? "text-white/70" : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate font-medium text-foreground">
                      {user?.name ?? "Account"}
                    </p>
                    {user?.email ? (
                      <p className="truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                      </p>
                    ) : null}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profileMenuItems.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Suspense
              fallback={
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-full",
                      isHeroTransparent ? "border-white/25 text-white bg-white/10" : ""
                    )}
                    asChild
                  >
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button
                    size="sm"
                    className={cn(
                      "rounded-full",
                      isHeroTransparent ? "bg-amber-400 text-slate-950 font-semibold" : ""
                    )}
                    asChild
                  >
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>
              }
            >
              <NavLoginRegisterLinks isHeroTransparent={isHeroTransparent} />
            </Suspense>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            "md:hidden p-2 rounded-lg transition-colors",
            isHeroTransparent ? "text-white hover:bg-white/15" : "text-foreground hover:bg-muted"
          )}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="md:hidden overflow-y-auto">
          <SheetTitle className="sr-only">Site navigation</SheetTitle>
          <Suspense fallback={null}>
            <MobileNavAutoClose onClose={closeMobileMenu} />
          </Suspense>
          <div className="flex min-h-full flex-col gap-5 pt-6">
            <div className="flex items-center pr-8">
              <span className="text-sm font-semibold text-foreground">Menu</span>
            </div>

            <div className="flex flex-col gap-2 border-b border-border pb-4">
              <Link
                href="/browse"
                className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                onClick={closeMobileMenu}
              >
                <Search className="size-4" aria-hidden />
                Browse Properties
              </Link>
              <Link
                href="/owner"
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                onClick={closeMobileMenu}
              >
                <Building2 className="size-4 text-primary" aria-hidden />
                List a Property
              </Link>
            </div>

            <div className="flex flex-col gap-3 border-b border-border pb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                Services
              </p>
              {serviceMenuItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                  onClick={closeMobileMenu}
                >
                  <Icon className="size-4 text-primary" aria-hidden />
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-b border-border pb-5">
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={closeMobileMenu}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
              <ThemeToggle showLabel />
            </div>

            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                  Account
                </p>
                <Link
                  href={getDashboardLink()}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                  onClick={closeMobileMenu}
                >
                  <LayoutDashboard className="size-4 text-primary" aria-hidden />
                  Dashboard
                </Link>
                {profileMenuItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                    onClick={closeMobileMenu}
                  >
                    <Icon className="size-4 text-primary" aria-hidden />
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  className="flex items-center gap-2 text-left text-sm text-destructive hover:opacity-80"
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                >
                  <LogOut className="size-4" aria-hidden />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Suspense
                  fallback={
                    <div className="flex w-full gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href="/login" onClick={closeMobileMenu}>
                          Log In
                        </Link>
                      </Button>
                      <Button size="sm" className="flex-1" asChild>
                        <Link href="/register" onClick={closeMobileMenu}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  }
                >
                  <NavLoginRegisterLinks className="w-full" onNavigate={closeMobileMenu} />
                </Suspense>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default Navbar;
