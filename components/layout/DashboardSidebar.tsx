"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarFooter,
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
import type { NavGroup } from "@/config/roleNav"

interface DashboardSidebarProps {
  groups: NavGroup[]
}

const DashboardSidebar = ({ groups }: DashboardSidebarProps) => {
  const router = useRouter()
  const { logout } = useAuth()
  const { state, isMobile, setOpenMobile } = useSidebar()

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }
  const [openGroups, setOpenGroups] = useState(
    () => new Set(groups.map((group) => group.title))
  )
  const { settings } = useSettings()
  const collapsed = state === "collapsed"
  const siteName = settings?.siteName?.trim() || SITE_NAME
  const logoUrl = settings?.primaryLogoUrl?.trim() || null
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
      <SidebarContent>
        {/* Logo — collapses to a centered icon tile so it fits the 3rem icon rail */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-border",
            collapsed ? "justify-center px-0" : "px-4"
          )}
        >
          <Link
            href="/"
            onClick={closeMobileSidebar}
            className={cn(
              "flex min-w-0 items-center gap-2 py-4",
              collapsed && "justify-center"
            )}
            aria-label={siteName}
          >
            {logoUrl ? (
              <span
                className={cn(
                  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted",
                  collapsed ? "h-8 w-8" : "h-9 w-9"
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
                  "hero-gradient flex shrink-0 items-center justify-center rounded-lg",
                  collapsed ? "h-8 w-8" : "h-9 w-9"
                )}
              >
                <Building2
                  className={cn(
                    "text-primary-foreground",
                    collapsed ? "h-4 w-4" : "h-5 w-5"
                  )}
                />
              </div>
            )}
            {!collapsed && (
              <span className="truncate font-heading text-lg font-bold text-foreground">
                {siteName}
              </span>
            )}
          </Link>
        </div>

        {groups.map((group) => {
          const open = openGroups.has(group.title)
          return (
            <Collapsible
              key={group.title}
              open={collapsed ? true : open}
              onOpenChange={() => toggleGroup(group.title)}
            >
              <SidebarGroup className="py-1.5">
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
                          "h-3.5 w-3.5 transition-transform",
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
                              className="min-w-0 hover:bg-muted/50"
                              activeClassName="bg-primary/10 text-primary font-medium"
                              aria-label={item.title}
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  ) : (
                    <CollapsibleContent>
                      <SidebarMenuSub className="mx-1.5 gap-1 border-l-border/70 px-2">
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                href={item.url}
                                end={item.url === "/dashboard"}
                                onClick={closeMobileSidebar}
                                className="min-w-0 hover:bg-muted/50"
                                activeClassName="bg-primary/10 text-primary font-medium"
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className="min-w-0 flex-1 wrap-break-word">
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
      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={() => void handleLogout()}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Logout</span> : null}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default DashboardSidebar
