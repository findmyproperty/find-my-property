"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CheckSquare,
  ClipboardList,
  CreditCard,
  FileText,
  HandHelping,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  LayoutList,
  LifeBuoy,
  Mail,
  MapPin,
  Monitor,
  PaintBucket,
  PartyPopper,
  Search,
  Settings,
  Store,
  Tag,
  Truck,
  UserCircle,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useAuth, type UserRole } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

type SearchAccess = "public" | "guest" | "auth";

type SearchEntry = {
  href: string;
  title: string;
  keywords: string;
  icon: LucideIcon;
  group: "Discover" | "Properties" | "Services" | "Account" | "Workspace";
  /** public = everyone; guest = logged-out only; auth = logged-in (optionally role-scoped) */
  access?: SearchAccess;
  roles?: readonly UserRole[];
};

const LISTING_ROLES = ["tenant", "agent", "admin"] as const satisfies readonly UserRole[];
const REQUEST_ROLES = ["tenant", "agent", "admin"] as const satisfies readonly UserRole[];
const AGENT_ROLES = ["agent"] as const satisfies readonly UserRole[];
const VENDOR_ROLES = ["vendor"] as const satisfies readonly UserRole[];
const ADMIN_ROLES = ["admin"] as const satisfies readonly UserRole[];
const LEAD_ROLES = ["agent", "vendor"] as const satisfies readonly UserRole[];
const ALERT_ROLES = ["vendor", "admin"] as const satisfies readonly UserRole[];
const SUPPORT_ROLES = ["vendor"] as const satisfies readonly UserRole[];

function canSeeEntry(
  entry: SearchEntry,
  isAuthenticated: boolean,
  role: UserRole | undefined,
): boolean {
  const access = entry.access ?? "public";
  if (access === "public") return true;
  if (access === "guest") return !isAuthenticated;
  if (!isAuthenticated) return false;
  if (!entry.roles || entry.roles.length === 0) return true;
  return !!role && entry.roles.includes(role);
}

const SITE_SEARCH_ENTRIES: SearchEntry[] = [
  // Discover
  {
    href: "/",
    title: "Home",
    keywords:
      "home landing start ybdc theybdc main page index welcome find property",
    icon: Home,
    group: "Discover",
  },
  {
    href: "/about",
    title: "About",
    keywords:
      "about company ybdc theybdc story mission vision who we are team brand consultancy",
    icon: BookOpen,
    group: "Discover",
  },
  {
    href: "/contact",
    title: "Contact",
    keywords:
      "contact support phone email help reach us call enquire enquiry office location address",
    icon: Mail,
    group: "Discover",
  },
  {
    href: "/#faq",
    title: "FAQs",
    keywords:
      "faq faqs questions help clarity common inquiries answers how why trust vendor",
    icon: HelpCircle,
    group: "Discover",
  },
  {
    href: "/sitemap",
    title: "Sitemap",
    keywords: "sitemap map all pages directory index navigation a-z links",
    icon: MapPin,
    group: "Discover",
  },
  {
    href: "/terms-and-conditions",
    title: "Terms & Conditions",
    keywords:
      "terms conditions norms legal rules t&c policy privacy agreement disclaimer",
    icon: FileText,
    group: "Discover",
  },

  // Properties
  {
    href: "/browse",
    title: "Browse properties",
    keywords:
      "browse search listings flats houses apartments villa property catalog real estate find",
    icon: Search,
    group: "Properties",
  },
  {
    href: "/browse?type=buy&sector=residential&posting=resale",
    title: "Buy properties",
    keywords:
      "buy sale purchase homes for sale residential resale ownership invest",
    icon: Building2,
    group: "Properties",
  },
  {
    href: "/browse?type=rent&sector=residential&posting=rent",
    title: "Rent properties",
    keywords:
      "rent rental lease tenant homes for rent pg paying guest monthly",
    icon: Building2,
    group: "Properties",
  },
  {
    href: "/browse?sector=residential",
    title: "Residential listings",
    keywords:
      "residential homes apartments flats bhk 1bhk 2bhk 3bhk housing villa independent house",
    icon: Home,
    group: "Properties",
  },
  {
    href: "/browse?type=buy&sector=commercial&posting=sale",
    title: "Commercial listings",
    keywords:
      "commercial office shop warehouse business space retail showroom co-working",
    icon: Store,
    group: "Properties",
  },
  {
    href: "/browse?sector=plot",
    title: "Land & plot listings",
    keywords:
      "land plot site farmland acreage na plot residential plot open land",
    icon: MapPin,
    group: "Properties",
  },
  {
    href: "/owner",
    title: "List a property",
    keywords:
      "list property owner add listing post sell rent out landlord post property free listing",
    icon: Building2,
    group: "Properties",
  },
  {
    href: "/add-property",
    title: "Add property",
    keywords:
      "add property create listing new draft publish post apartment society",
    icon: Building2,
    group: "Properties",
    access: "auth",
    roles: LISTING_ROLES,
  },
  {
    href: "/listings",
    title: "My listings",
    keywords:
      "my listings properties posted owned drafts manage edit my properties",
    icon: LayoutList,
    group: "Properties",
    access: "auth",
    roles: LISTING_ROLES,
  },
  {
    href: "/favorites",
    title: "Favorites",
    keywords:
      "favorites saved wishlist bookmarked properties shortlist liked",
    icon: Heart,
    group: "Properties",
    access: "auth",
  },
  {
    href: "/properties",
    title: "All properties",
    keywords:
      "all properties admin marketplace catalog manage every listing inventory",
    icon: LayoutList,
    group: "Properties",
    access: "auth",
    roles: ADMIN_ROLES,
  },

  // Services
  {
    href: "/#services",
    title: "All services",
    keywords:
      "services ecosystem platform offerings home business finance relocation",
    icon: LayoutDashboard,
    group: "Services",
  },
  {
    href: "/event-management",
    title: "Event Management",
    keywords:
      "event management party celebration corporate planning wedding birthday function",
    icon: PartyPopper,
    group: "Services",
  },
  {
    href: "/general-services",
    title: "General Services",
    keywords:
      "general services errands assembly maintenance concierge help everyday tasks odd jobs",
    icon: HandHelping,
    group: "Services",
  },
  {
    href: "/home-services",
    title: "Home Services",
    keywords:
      "home services plumber carpenter electrician repairs handover ac painting fittings",
    icon: Wrench,
    group: "Services",
  },
  {
    href: "/it-services",
    title: "IT Services",
    keywords:
      "it services laptop repair networking cctv tech infrastructure wifi computer software",
    icon: Monitor,
    group: "Services",
  },
  {
    href: "/job-consultancy",
    title: "Job Consultancy",
    keywords:
      "job consultancy career hiring talent recruitment employment resume placement hr",
    icon: Briefcase,
    group: "Services",
  },
  {
    href: "/loans",
    title: "Loan Assistance",
    keywords:
      "loan assistance finance mortgage funding credit emi bank home loan advisory",
    icon: Wallet,
    group: "Services",
  },
  {
    href: "/loans/home",
    title: "Home loans",
    keywords:
      "home loan housing finance mortgage purchase property loan emi",
    icon: Home,
    group: "Services",
  },
  {
    href: "/loans/mortgages",
    title: "Mortgages",
    keywords:
      "mortgage loan against property lap refinance balance transfer equity",
    icon: CreditCard,
    group: "Services",
  },
  {
    href: "/loans/personal",
    title: "Personal loans",
    keywords:
      "personal loan unsecured finance credit instant cash salary loan",
    icon: Wallet,
    group: "Services",
  },
  {
    href: "/loans/vehicle",
    title: "Vehicle loans",
    keywords:
      "vehicle loan car bike auto finance two wheeler four wheeler",
    icon: CreditCard,
    group: "Services",
  },
  {
    href: "/packers-movers",
    title: "Packers & Movers",
    keywords:
      "packers movers shifting relocation moving house transport packing unpacking",
    icon: Truck,
    group: "Services",
  },
  {
    href: "/painting-cleaning",
    title: "Painting & Cleaning",
    keywords:
      "painting cleaning paint deep clean move-in house painting waterproofing",
    icon: PaintBucket,
    group: "Services",
  },
  {
    href: "/register-vendor",
    title: "Register as vendor",
    keywords:
      "vendor partner join register service provider business become vendor signup vendor",
    icon: Store,
    group: "Services",
    access: "guest",
  },

  // Account
  {
    href: "/login",
    title: "Log in",
    keywords:
      "login log in sign in auth account access otp password phone",
    icon: UserCircle,
    group: "Account",
    access: "guest",
  },
  {
    href: "/register",
    title: "Sign up",
    keywords:
      "register signup sign up create account join new user registration",
    icon: UserCircle,
    group: "Account",
    access: "guest",
  },
  {
    href: "/forgot-password",
    title: "Forgot password",
    keywords:
      "forgot password reset recover unlock account change password otp",
    icon: LifeBuoy,
    group: "Account",
    access: "guest",
  },
  {
    href: "/profile",
    title: "Profile",
    keywords:
      "profile edit account settings personal details name phone avatar me",
    icon: UserCircle,
    group: "Account",
    access: "auth",
  },
  {
    href: "/dashboard",
    title: "Dashboard",
    keywords:
      "dashboard overview workspace home panel my account admin vendor agent",
    icon: LayoutDashboard,
    group: "Account",
    access: "auth",
  },
  {
    href: "/settings",
    title: "Settings",
    keywords:
      "settings preferences account configuration options privacy security",
    icon: Settings,
    group: "Account",
    access: "auth",
  },
  {
    href: "/support",
    title: "Support",
    keywords:
      "support help desk ticket assistance vendor support contact help",
    icon: LifeBuoy,
    group: "Account",
    access: "auth",
    roles: SUPPORT_ROLES,
  },
  {
    href: "/alerts",
    title: "Alerts",
    keywords:
      "alerts notifications bell messages updates inbox notice",
    icon: Bell,
    group: "Account",
    access: "auth",
    roles: ALERT_ROLES,
  },

  // Workspace
  {
    href: "/my-requests",
    title: "My service requests",
    keywords:
      "my requests services bookings orders status track service request history",
    icon: ClipboardList,
    group: "Workspace",
    access: "auth",
    roles: REQUEST_ROLES,
  },
  {
    href: "/leads",
    title: "Leads",
    keywords:
      "leads enquiries prospects sales pipeline inquiries customer leads",
    icon: Users,
    group: "Workspace",
    access: "auth",
    roles: LEAD_ROLES,
  },
  {
    href: "/reports",
    title: "Reports",
    keywords:
      "reports analytics metrics performance charts agent sales report",
    icon: BarChart3,
    group: "Workspace",
    access: "auth",
    roles: AGENT_ROLES,
  },
  {
    href: "/analytics",
    title: "Analytics",
    keywords:
      "analytics insights stats trends data dashboard charts admin",
    icon: BarChart3,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/wallet",
    title: "Wallet",
    keywords:
      "wallet payments balance earnings payouts money credits vendor wallet",
    icon: Wallet,
    group: "Workspace",
    access: "auth",
    roles: VENDOR_ROLES,
  },
  {
    href: "/approvals",
    title: "Property approval",
    keywords:
      "approvals property review moderate listing verify approve reject admin",
    icon: CheckSquare,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/agents",
    title: "Agent management",
    keywords:
      "agents manage agents team realtors brokers agent list admin",
    icon: Users,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/activity",
    title: "Activity log",
    keywords:
      "activity log audit trail history admin events actions",
    icon: Activity,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/email-logs",
    title: "Email log",
    keywords:
      "email logs messages outbound mail admin smtp notifications sent",
    icon: Mail,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/categories",
    title: "Categories",
    keywords:
      "categories tags property types taxonomy admin sectors posting types",
    icon: Tag,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/customers",
    title: "Customers",
    keywords:
      "customers users people directory admin tenants buyers clients",
    icon: Users,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/service-requests",
    title: "Service requests (admin)",
    keywords:
      "admin service requests manage bookings home services packers loans jobs",
    icon: ClipboardList,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/loan-requests",
    title: "Loan requests",
    keywords:
      "loan requests finance applications admin mortgage home personal vehicle",
    icon: CreditCard,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/job-consultancy",
    title: "Job consultancy (admin)",
    keywords:
      "job consultancy admin talent applications careers hiring requests",
    icon: Briefcase,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/complaints",
    title: "Complaints",
    keywords:
      "complaints disputes issues tickets admin grievance feedback",
    icon: LifeBuoy,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/vendors",
    title: "Vendors",
    keywords:
      "vendors partners providers directory admin service vendors list",
    icon: Store,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/vendor-leads",
    title: "Vendor leads",
    keywords:
      "vendor leads jobs assignments pipeline admin allocate dispatch",
    icon: ClipboardList,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/payments",
    title: "Vendor payments",
    keywords:
      "vendor payments payouts settlements admin wallet transfer pay",
    icon: CreditCard,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
  {
    href: "/admin/settings",
    title: "Admin settings",
    keywords:
      "admin settings system configuration branding site options",
    icon: Settings,
    group: "Workspace",
    access: "auth",
    roles: ADMIN_ROLES,
  },
];

const GROUP_ORDER: SearchEntry["group"][] = [
  "Discover",
  "Properties",
  "Services",
  "Account",
  "Workspace",
];

function sortByTitle(a: SearchEntry, b: SearchEntry) {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

type SiteSearchDialogProps = {
  triggerClassName?: string;
  iconOnly?: boolean;
};

export function SiteSearchDialog({
  triggerClassName,
  iconOnly = true,
}: SiteSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const role = user?.role;

  const results = useMemo(() => {
    const visible = SITE_SEARCH_ENTRIES.filter((page) =>
      canSeeEntry(page, isAuthenticated, role),
    );
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? visible
      : visible.filter((page) => {
          const haystack = `${page.title} ${page.keywords} ${page.group}`.toLowerCase();
          return (
            haystack.includes(q) ||
            q.split(/\s+/).every((part) => haystack.includes(part))
          );
        });

    return [...filtered].sort(sortByTitle);
  }, [isAuthenticated, query, role]);

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      items: results.filter((item) => item.group === group),
    })).filter((section) => section.items.length > 0);
  }, [results]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={iconOnly ? "icon" : "sm"}
        className={cn(iconOnly ? "size-9 rounded-full" : "rounded-full", triggerClassName)}
        aria-label="Search site"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        {!iconOnly ? <span className="ml-2">Search</span> : null}
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <CommandInput
          placeholder="Search pages, services, properties, account…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            No matches. Try “loan”, “browse”, “vendor”, or “dashboard”.
          </CommandEmpty>
          {grouped.map(({ group, items }) => (
            <CommandGroup key={group} heading={group}>
              {items.map((page) => (
                <CommandItem
                  key={`${page.group}:${page.href}:${page.title}`}
                  value={`${page.title} ${page.keywords} ${page.group}`}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(page.href);
                  }}
                >
                  <page.icon className="mr-2 size-4 shrink-0 opacity-70" />
                  <span>{page.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
