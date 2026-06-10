"use client"

import type { ReactNode } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import DashboardSidebar from "@/components/layout/DashboardSidebar"
import DashboardHeader from "@/components/layout/DashboardHeader"
import type { LucideIcon } from "lucide-react"

export interface DashboardNavItem {
  title: string
  url: string
  icon: LucideIcon
}

export function DashboardShell({
  items,
  title,
  children,
}: {
  items: DashboardNavItem[]
  title?: string
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-full w-full">
        <DashboardSidebar groups={[{ title: "Navigation", items }]} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DashboardHeader title={title} />
          <main className="min-h-0 flex-1 overflow-x-hidden bg-background p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
