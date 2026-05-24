"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ServiceAuthModalProvider } from "@/contexts/service-auth-modal-context";
import { useAuth } from "@/contexts/auth-context";
import { getNavItemsForRole, getDashboardTitleForRole } from "@/config/roleNav";
import { UserRole } from "@/end-points/types";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";

function isMarketplacePath(pathname: string) {
  return pathname === "/browse" || pathname.startsWith("/property/");
}

function MarketplacePublicChrome({ children, isPropertyPage = false }: { children: ReactNode, isPropertyPage?: boolean }) {
  const padding = isPropertyPage ? "px-5 md:px-20 pt-18" : "px-5 md:px-10";
  return (
    <ServiceAuthModalProvider>
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
        <Navbar />
        <div className={cn("min-h-0 flex-1", padding)}>{children}</div>
        <Footer />
      </div>
    </ServiceAuthModalProvider>
  );
}

export default function RolesRoutesShell({
  role,
  children,
}: {
  role?: UserRole;
  children: ReactNode;
}) {
  const { user, isAuthenticated, isAuthReady, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const marketplace = isMarketplacePath(pathname);
  const showSidebar = isAuthReady && isAuthenticated && user;
  const isPropertyPage = pathname.startsWith("/property/");

  useLayoutEffect(() => {
    if (role != null && user && role !== user.role) {
      logout().then(() => {
        router.refresh();
      });
    }
  }, [role, user, logout, router]);

  if (showSidebar && user) {
    const items = getNavItemsForRole(user.role);
    const title = getDashboardTitleForRole(user.role);
    return (
      <SidebarProvider>
        <div className="flex h-full w-full bg-background">
          <DashboardSidebar items={items} />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardHeader title={title} />
            <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (marketplace) {
    return <MarketplacePublicChrome isPropertyPage={isPropertyPage}>{children}</MarketplacePublicChrome>;
  }

  return (
    <div className="flex h-dvh items-center justify-center gap-3 overflow-x-hidden bg-background">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Please wait while we load the page...</p>
    </div>
  );
}
