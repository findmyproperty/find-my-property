"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Building2, ChevronRight, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { NavLink } from "@/components/layout/NavLink"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { SITE_NAME } from "@/lib/branding"
import { useSettings } from "@/contexts/settings-context"
import { cn } from "@/lib/utils"
import { useUnreadNotificationCount } from "@/hooks/use-notifications"
import { getRoleSidebarLabel, type NavGroup } from "@/config/roleNav"

interface DashboardSidebarProps {
  groups: NavGroup[]
}

function isNavItemActive(pathname: string, url: string, end?: boolean) {
  return end
    ? pathname === url
    : pathname === url || (url !== "/" && pathname.startsWith(`${url}/`))
}

function groupHasActiveItem(pathname: string, group: NavGroup) {
  return group.items.some((item) =>
    isNavItemActive(pathname, item.url, item.url === "/dashboard")
  )
}

const DashboardSidebar = ({ groups }: DashboardSidebarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { state, isMobile, setOpenMobile } = useSidebar()

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const initialOpenGroups = useMemo(() => {
    const open = new Set<string>()
    for (const group of groups) {
      if (groupHasActiveItem(pathname, group)) {
        open.add(group.title)
      }
    }
    if (open.size === 0) {
      groups.forEach((group) => open.add(group.title))
    }
    return open
  }, [groups, pathname])

  const [openGroups, setOpenGroups] = useState(initialOpenGroups)

  useEffect(() => {
    setOpenGroups((current) => {
      const next = new Set(current)
      for (const group of groups) {
        if (groupHasActiveItem(pathname, group)) {
          next.add(group.title)
        }
      }
      return next
    })
  }, [pathname, groups])
  const { settings } = useSettings()
  const collapsed = state === "collapsed"
  const siteName = settings?.siteName?.trim() || SITE_NAME
  const logoUrl = settings?.primaryLogoUrl?.trim() || null
  const roleLabel = getRoleSidebarLabel(user?.role)
  const { data: unreadData } = useUnreadNotificationCount()
  const unreadCount = unreadData?.count ?? 0

  const handleLogout = async () => {
    closeMobileSidebar()
    await logout()
    router.refresh()
  }

  const toggleGroup = (title: string) => {
    setOpenGroups((current) => {
      const next = new Set(current)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={siteName}>
              <Link href="/" onClick={closeMobileSidebar}>
                {logoUrl ? (
                  <span
                    className={cn(
                      "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card ring-1 ring-border/70",
                      collapsed ? "size-8" : "h-11 w-16"
                    )}
                  >
                    <Image
                      src={logoUrl}
                      alt={siteName}
                      fill
                      sizes={collapsed ? "32px" : "64px"}
                      unoptimized
                      className="object-contain"
                    />
                  </span>
                ) : (
                  <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Building2 className="size-4" />
                  </span>
                )}
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">{siteName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {roleLabel}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => {
          const open = openGroups.has(group.title)
          const singleItem = group.items.length === 1 ? group.items[0] : null

          if (singleItem) {
            return (
              <SidebarGroup key={group.title} className="py-0.5">
                <SidebarGroupLabel className="font-heading text-[11px] tracking-wide uppercase">
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={singleItem.title}>
                        <NavLink
                          href={singleItem.url}
                          end={singleItem.url === "/dashboard"}
                          onClick={closeMobileSidebar}
                          activeClassName="bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        >
                          <singleItem.icon className="size-4 shrink-0" />
                          <span>{singleItem.title}</span>
                          {singleItem.url === "/alerts" && unreadCount > 0 ? (
                            <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          ) : null}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          }

          return (
            <Collapsible
              key={group.title}
              open={collapsed ? true : open}
              onOpenChange={() => toggleGroup(group.title)}
            >
              <SidebarGroup className="py-0.5">
                <CollapsibleTrigger asChild disabled={collapsed}>
                  <SidebarGroupLabel
                    asChild
                    className="font-heading text-[11px] tracking-wide uppercase"
                  >
                    <button
                      type="button"
                      className={cn(
                        "w-full justify-between",
                        collapsed && "pointer-events-none"
                      )}
                    >
                      <span>{group.title}</span>
                      <ChevronRight
                        className={cn(
                          "size-3.5 transition-transform",
                          open && "rotate-90"
                        )}
                        aria-hidden
                      />
                    </button>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <SidebarGroupContent>
                  {collapsed ? (
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild tooltip={item.title}>
                            <NavLink
                              href={item.url}
                              end={item.url === "/dashboard"}
                              onClick={closeMobileSidebar}
                              activeClassName="bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                              aria-label={item.title}
                            >
                              <item.icon className="size-4 shrink-0" />
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  ) : (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                href={item.url}
                                end={item.url === "/dashboard"}
                                onClick={closeMobileSidebar}
                                activeClassName="bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                              >
                                <item.icon className="size-4 shrink-0" />
                                <span className="min-w-0 flex-1 truncate">
                                  {item.title}
                                </span>
                                {item.url === "/alerts" && unreadCount > 0 ? (
                                  <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                  </span>
                                ) : null}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>

      {user ? (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="Log out"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void handleLogout()}
              >
                <LogOut className="size-4 shrink-0" />
                <span>Log out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      ) : null}
    </Sidebar>
  )
}

export default DashboardSidebar
