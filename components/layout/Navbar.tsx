"use client";

import { Suspense, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type ProfileMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const serviceMenuItems: ServiceMenuItem[] = [
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
  {
    href: "/event-management",
    label: "Event Management",
    description: "Planning support for celebrations and corporate events.",
    icon: PartyPopper,
  },
  {
    href: "/loans",
    label: "Loans",
    description: "Home, mortgage, personal, and vehicle loan assistance.",
    icon: Wallet,
  },
  {
    href: "/job-consultancy",
    label: "Job Consultancy",
    description: "Career support and hiring leads for property teams.",
    icon: Users,
  },
];

function getProfileMenuItems(role: UserRole | undefined): ProfileMenuItem[] {
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

  const handleLogout = () => {
    logout().then(() => {
      router.refresh();
    });
  };

  const profileMenuItems = getProfileMenuItems(user?.role);

  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex h-20 min-w-0 items-center justify-between px-4 md:h-24">
        <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
          <Link href="/" className="flex shrink-0 items-center" onClick={closeMobileMenu}>
            {logoUrl ? (
              <span className="relative inline-flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg md:h-20 md:w-32">
                <Image
                  src={logoUrl}
                  alt={siteName}
                  fill
                  sizes="(min-width: 768px) 128px, 96px"
                  unoptimized
                  className="object-contain"
                />
              </span>
            ) : (
              <div className="hero-gradient flex size-12 shrink-0 items-center justify-center rounded-xl md:size-14">
                <Building2 className="size-6 text-primary-foreground md:size-7" />
              </div>
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <NavigationMenu>
              <NavigationMenuList className="gap-0">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-auto bg-transparent px-0 py-0 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-foreground data-[state=open]:bg-transparent data-[state=open]:text-foreground">
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[640px] grid-cols-2 gap-2 p-4">
                      {serviceMenuItems.map(({ href, label, description, icon: Icon }) => (
                        <NavigationMenuLink key={href} asChild>
                          <Link
                            href={href}
                            className="flex rounded-md p-3 transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
                          >
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <span className="ml-3 min-w-0">
                              <span className="block font-medium leading-none text-foreground">
                                {label}
                              </span>
                              <span className="mt-1.5 line-clamp-2 block text-sm leading-snug text-muted-foreground">
                                {description}
                              </span>
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  Dashboard
                </Link>
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none">
                  <UserAvatar
                    name={user?.name ?? "User"}
                    avatarUrl={user?.avatarUrl}
                    className="h-7 w-7"
                    fallbackClassName="text-[10px]"
                  />
                  <span className="max-w-[120px] truncate">Profile</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
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
