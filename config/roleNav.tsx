import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CheckSquare,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LayoutList,
  LifeBuoy,
  Mail,
  Briefcase,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Store,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import type { UserRole } from "@/contexts/auth-context"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

const tenantNavGroups: NavGroup[] = [
  {
    title: "Workspace",
    items: [{ title: "Overview", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Properties",
    items: [
      { title: "Browse", url: "/browse", icon: Search },
      { title: "My Listings", url: "/listings", icon: Building2 },
    ],
  },
  {
    title: "Services",
    items: [{ title: "My Requests", url: "/my-requests", icon: ClipboardList }],
  },
  {
    title: "Account",
    items: [{ title: "Profile", url: "/profile", icon: UserCircle }],
  },
]

const agentNavGroups: NavGroup[] = [
  {
    title: "Workspace",
    items: [{ title: "Overview", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Properties",
    items: [
      { title: "Browse", url: "/browse", icon: Search },
      { title: "My Listings", url: "/listings", icon: Building2 },
    ],
  },
  {
    title: "Sales",
    items: [
      { title: "Leads", url: "/leads", icon: Users },
      { title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Services",
    items: [{ title: "My Requests", url: "/my-requests", icon: ClipboardList }],
  },
  {
    title: "Account",
    items: [{ title: "Profile", url: "/profile", icon: UserCircle }],
  },
]

const vendorNavGroups: NavGroup[] = [
  {
    title: "Workspace",
    items: [{ title: "Overview", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Jobs & payments",
    items: [
      { title: "Leads", url: "/leads", icon: Users },
      { title: "Wallet", url: "/wallet", icon: Wallet },
    ],
  },
  {
    title: "Support",
    items: [
      { title: "Alerts", url: "/alerts", icon: Bell },
      { title: "Support", url: "/support", icon: LifeBuoy },
    ],
  },
  {
    title: "Account",
    items: [{ title: "Profile", url: "/profile", icon: UserCircle }],
  },
]

const adminNavGroups: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
      { title: "Activity Log", url: "/admin/activity", icon: Activity },
      { title: "Email Log", url: "/admin/email-logs", icon: Mail },
      { title: "Alerts", url: "/alerts", icon: Bell },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Property Approval", url: "/approvals", icon: CheckSquare },
      { title: "Agent Management", url: "/agents", icon: Users },
      { title: "Customers", url: "/admin/customers", icon: Users },
      {
        title: "Service Requests",
        url: "/admin/service-requests",
        icon: Sparkles,
      },
      {
        title: "Loan Requests",
        url: "/admin/loan-requests",
        icon: CreditCard,
      },
      {
        title: "Job Consultancy",
        url: "/admin/job-consultancy",
        icon: Briefcase,
      },
      { title: "Complaints", url: "/admin/complaints", icon: LifeBuoy },
    ],
  },
  {
    title: "Vendors",
    items: [
      { title: "Vendor Partners", url: "/admin/vendors", icon: Store },
      {
        title: "Vendor Leads",
        url: "/admin/vendor-leads",
        icon: ClipboardList,
      },
      { title: "Vendor Payments", url: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { title: "Browse", url: "/browse", icon: Search },
      { title: "My Listings", url: "/listings", icon: Building2 },
      { title: "All properties", url: "/properties", icon: LayoutList },
    ],
  },
  {
    title: "Account & system",
    items: [
      { title: "Settings", url: "/admin/settings", icon: SettingsIcon },
      { title: "Profile", url: "/profile", icon: UserCircle },
    ],
  },
]

const flattenNavGroups = (groups: NavGroup[]) =>
  groups.flatMap((group) => group.items)

/** Flat routes under app/(roles-routes); used by sitemap and legacy consumers. */
const tenantNav: NavItem[] = flattenNavGroups(tenantNavGroups)
const agentNav: NavItem[] = flattenNavGroups(agentNavGroups)
const vendorNav: NavItem[] = flattenNavGroups(vendorNavGroups)
const adminNav: NavItem[] = flattenNavGroups(adminNavGroups)

const dashboardTitles: Record<UserRole, string> = {
  tenant: "Tenant Dashboard",
  agent: "Agent Dashboard",
  admin: "Admin Dashboard",
  vendor: "Partner Dashboard",
}

export function getNavGroupsForRole(role: UserRole | undefined): NavGroup[] {
  switch (role) {
    case "tenant":
      return tenantNavGroups
    case "agent":
      return agentNavGroups
    case "admin":
      return adminNavGroups
    case "vendor":
      return vendorNavGroups
    default:
      return tenantNavGroups
  }
}

export function getNavItemsForRole(role: UserRole | undefined): NavItem[] {
  return flattenNavGroups(getNavGroupsForRole(role))
}

export function getDashboardTitleForRole(role: UserRole | undefined): string {
  if (!role) return "Dashboard"
  return dashboardTitles[role]
}

export {
  tenantNav,
  agentNav,
  adminNav,
  vendorNav,
  tenantNavGroups,
  agentNavGroups,
  adminNavGroups,
  vendorNavGroups,
}
