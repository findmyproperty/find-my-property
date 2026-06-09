"use client";

import { Building2, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { NavLink } from "@/components/layout/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LucideIcon } from "lucide-react";
import { SITE_NAME } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";
import { cn } from "@/lib/utils";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  items: NavItem[];
}

const DashboardSidebar = ({ items }: DashboardSidebarProps) => {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const { settings } = useSettings();
  const collapsed = state === "collapsed";
  const siteName = settings?.siteName?.trim() || SITE_NAME;
  const logoUrl = settings?.primaryLogoUrl?.trim() || null;
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent >
        {/* Logo — collapses to a centered icon tile so it fits the 3rem icon rail */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-border",
            collapsed ? "justify-center px-0" : "px-4",
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 min-w-0",
              collapsed && "justify-center",
            )}
            aria-label={siteName}
          >
            {logoUrl ? (
              <span
                className={cn(
                  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted",
                  collapsed ? "h-8 w-8" : "h-9 w-9",
                )}
              >
                <Image
                  src={logoUrl}
                  alt={siteName}
                  fill
                  sizes={collapsed ? "32px" : "36px"}
                  unoptimized
                  className="object-contain"
                />
              </span>
            ) : (
              <div
                className={cn(
                  "rounded-lg hero-gradient flex items-center justify-center shrink-0",
                  collapsed ? "w-8 h-8" : "w-9 h-9",
                )}
              >
                <Building2
                  className={cn(
                    "text-primary-foreground",
                    collapsed ? "w-4 h-4" : "w-5 h-5",
                  )}
                />
              </div>
            )}
            {!collapsed && (
              <span className="font-heading font-bold text-lg text-foreground truncate">
                {siteName}
              </span>
            )}
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      href={item.url}
                      end={index === 0}
                      className="hover:bg-muted/50 min-w-0"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="min-w-0 flex-1 wrap-break-word">{item.title}</span>
                      )}
                      {!collapsed && item.url === "/alerts" && unreadCount > 0 ? (
                        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      ) : null}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
