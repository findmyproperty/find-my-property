"use client"

import type { ReactNode } from "react"
import { Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AdminSearchInput } from "@/components/admin/admin-search-input"
import { AdminStatusFilter } from "@/components/admin/admin-status-filter"
import type { AdminStatusOption } from "@/lib/admin/status-config"

type AdminToolbarProps = {
  statusFilter?: {
    value: string
    onChange: (value: string) => void
    options: readonly AdminStatusOption[]
    counts?: Partial<Record<string, number>>
    totalCount?: number
    label?: string
  }
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  filterSheet?: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    hasActiveFilters?: boolean
    onClear?: () => void
    children: ReactNode
  }
  trailing?: ReactNode
}

export function AdminToolbar({
  statusFilter,
  search,
  filterSheet,
  trailing,
}: AdminToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      {statusFilter ? (
        <AdminStatusFilter
          value={statusFilter.value}
          onChange={statusFilter.onChange}
          options={statusFilter.options}
          counts={statusFilter.counts}
          totalCount={statusFilter.totalCount}
          label={statusFilter.label}
        />
      ) : null}

      <div className="flex w-full min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center lg:max-w-2xl">
        {search ? (
          <AdminSearchInput
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {filterSheet ? (
            <Sheet open={filterSheet.open} onOpenChange={filterSheet.onOpenChange}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Filter className="size-4" aria-hidden />
                  Filter
                  {filterSheet.hasActiveFilters ? (
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                      On
                    </Badge>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
              >
                <SheetHeader className="text-left">
                  <SheetTitle>{filterSheet.title}</SheetTitle>
                  {filterSheet.description ? (
                    <SheetDescription>{filterSheet.description}</SheetDescription>
                  ) : null}
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-4 py-6">
                  {filterSheet.children}
                </div>
                <SheetFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                  {filterSheet.hasActiveFilters && filterSheet.onClear ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full sm:w-auto"
                      onClick={filterSheet.onClear}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    onClick={() => filterSheet.onOpenChange(false)}
                  >
                    Done
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ) : null}

          {filterSheet?.hasActiveFilters && filterSheet.onClear ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={filterSheet.onClear}
            >
              Clear filters
            </Button>
          ) : null}

          {trailing}
        </div>
      </div>
    </div>
  )
}
