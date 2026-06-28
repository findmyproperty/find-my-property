"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import { Eye, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import {
  AdminListEmpty,
  AdminListError,
  AdminListLoading,
} from "@/components/admin/admin-list-states"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminToolbar } from "@/components/admin/admin-toolbar"
import {
  compareDates,
  compareStrings,
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls"
import { SUPPORT_TICKET_STATUS_OPTIONS } from "@/lib/admin/status-config"
import {
  useAdminPatchSupportTicket,
  useAdminSupportTickets,
} from "@/hooks/use-support-tickets"
import type { SupportTicket, SupportTicketStatus } from "@/schema/support-ticket"
import { useToast } from "@/hooks/use-toast"

const PAGE_SIZE = 20
const FETCH_LIMIT = 1000
const STATUSES: SupportTicketStatus[] = ["open", "in_progress", "resolved"]

type StatusFilter = "all" | SupportTicketStatus
type RoleFilter = "all" | "tenant" | "agent" | "vendor"
type TicketSortKey = "subject" | "from" | "category" | "status" | "updatedAt"

function formatCategory(category: string) {
  return category.replace(/_/g, " ")
}

function ticketSearchText(ticket: SupportTicket): string {
  return [
    ticket.subject,
    ticket.body,
    ticket.user?.name,
    ticket.userRole,
    ticket.category,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
}

function fromLabel(ticket: SupportTicket): string {
  return ticket.user?.name ?? `User #${ticket.userId}`
}

function compareTickets(a: SupportTicket, b: SupportTicket, key: TicketSortKey): number {
  switch (key) {
    case "subject":
      return compareStrings(a.subject, b.subject)
    case "from":
      return compareStrings(fromLabel(a), fromLabel(b))
    case "category":
      return compareStrings(a.category, b.category)
    case "status":
      return compareStrings(a.status, b.status)
    case "updatedAt":
      return compareDates(a.updatedAt, b.updatedAt)
  }
}

export default function AdminComplaints() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [draftStatus, setDraftStatus] = useState<SupportTicketStatus>("open")
  const [adminNotes, setAdminNotes] = useState("")

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
    filterSheetOpen,
    setFilterSheetOpen,
  } = useAdminListControls<TicketSortKey>({
    defaultSort: { key: "updatedAt", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [statusFilter, roleFilter, categoryFilter],
  })

  const query = {
    status: statusFilter === "all" ? undefined : statusFilter,
    page: 1,
    limit: FETCH_LIMIT,
  }

  const { data, isLoading, isError, error, isFetching } = useAdminSupportTickets(query)
  const { mutate: patch, isPending } = useAdminPatchSupportTicket()
  const { toast } = useToast()

  useEffect(() => {
    if (!selected) return
    setDraftStatus(selected.status)
    setAdminNotes(selected.adminNotes ?? "")
  }, [selected])

  const allItems = data?.items ?? []
  const categories = useMemo(
    () => [...new Set(allItems.map((ticket) => ticket.category))].sort(),
    [allItems],
  )

  const statusCounts = useMemo(
    () => ({
      open: allItems.filter((ticket) => ticket.status === "open").length,
      in_progress: allItems.filter((ticket) => ticket.status === "in_progress").length,
      resolved: allItems.filter((ticket) => ticket.status === "resolved").length,
    }),
    [allItems],
  )

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const filtered = allItems.filter((ticket) => {
      if (roleFilter !== "all" && ticket.userRole !== roleFilter) return false
      if (categoryFilter !== "all" && ticket.category !== categoryFilter) return false
      if (q && !ticketSearchText(ticket).includes(q)) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      const result = compareTickets(a, b, sort.key)
      return sort.dir === "asc" ? result : -result
    })
  }, [allItems, categoryFilter, debouncedSearch, roleFilter, sort.dir, sort.key])

  const pagedItems = useMemo(
    () => paginateItems(filteredItems, page, PAGE_SIZE),
    [filteredItems, page],
  )

  const clearFilters = () => {
    setRoleFilter("all")
    setCategoryFilter("all")
  }

  const hasActiveFilters = roleFilter !== "all" || categoryFilter !== "all"

  const save = () => {
    if (!selected) return
    const input: { status?: SupportTicketStatus; adminNotes?: string | null } = {}
    if (draftStatus !== selected.status) input.status = draftStatus
    const notes = adminNotes.trim()
    if (notes !== (selected.adminNotes ?? "")) {
      input.adminNotes = notes || null
    }
    if (Object.keys(input).length === 0) return

    patch(
      { id: selected.id, input },
      {
        onSuccess: (updated) => {
          setSelected(updated)
          toast({ title: "Ticket updated" })
        },
        onError: (e) =>
          toast({
            title: "Update failed",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
      },
    )
  }

  const markResolved = useCallback(
    (ticket: SupportTicket) => {
      if (ticket.status === "resolved") return
      patch(
        { id: ticket.id, input: { status: "resolved" } },
        {
          onSuccess: (updated) => {
            setSelected((current) => (current?.id === ticket.id ? updated : current))
            toast({ title: "Ticket marked resolved" })
          },
          onError: (e) =>
            toast({
              title: "Update failed",
              description: e instanceof Error ? e.message : undefined,
              variant: "destructive",
            }),
        },
      )
    },
    [patch, toast],
  )

  const ticketColumns = useMemo<ColumnDef<SupportTicket, unknown>[]>(
    () => [
      {
        id: "subject",
        header: "Subject",
        meta: { sortKey: "subject", className: "max-w-[240px] min-w-[12rem] font-medium" },
        cell: ({ row }) => (
          <span className="line-clamp-2">{row.original.subject}</span>
        ),
      },
      {
        id: "from",
        header: "From",
        meta: { sortKey: "from", className: "min-w-[9rem]" },
        cell: ({ row }) => {
          const ticket = row.original
          return (
            <span className="text-sm">
              {fromLabel(ticket)}
              <span className="block text-xs capitalize text-muted-foreground">
                {ticket.userRole}
              </span>
            </span>
          )
        },
      },
      {
        id: "category",
        header: "Category",
        meta: { sortKey: "category", className: "hidden sm:table-cell" },
        cell: ({ row }) => (
          <span className="text-sm capitalize">{formatCategory(row.original.category)}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        meta: { sortKey: "status" },
        cell: ({ row }) => (
          <AdminStatusBadge
            status={row.original.status}
            options={SUPPORT_TICKET_STATUS_OPTIONS}
          />
        ),
      },
      {
        id: "updated",
        header: "Updated",
        meta: { sortKey: "updatedAt" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.updatedAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        meta: { className: "text-right w-[4.5rem]" },
        cell: ({ row }) => {
          const ticket = row.original
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Ticket actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onSelect={() => setSelected(ticket)}
                  >
                    <Eye className="size-3.5" />
                    View & update
                  </DropdownMenuItem>
                  {ticket.status !== "resolved" ? (
                    <DropdownMenuItem
                      className="cursor-pointer gap-2"
                      disabled={isPending}
                      onSelect={() => markResolved(ticket)}
                    >
                      Mark resolved
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [isPending, markResolved],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Complaints & support"
        description="Review support tickets in a sortable table. Use search and filters to find tickets, then update status or notes."
      />

      {isError ? (
        <AdminListError
          title="Could not load support tickets"
          message={(error as Error)?.message ?? "Please refresh the page or try again."}
        />
      ) : null}

      {isLoading ? (
        <AdminListLoading label="Loading tickets…" />
      ) : (
        <div className="w-full space-y-4">
          <AdminToolbar
            statusFilter={{
              value: statusFilter,
              onChange: (value) => setStatusFilter(value as StatusFilter),
              options: SUPPORT_TICKET_STATUS_OPTIONS,
              counts: statusCounts,
              totalCount: allItems.length,
            }}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search subject, user, category, or message…",
            }}
            filterSheet={{
              open: filterSheetOpen,
              onOpenChange: setFilterSheetOpen,
              title: "Filters",
              description: "Narrow by user role or ticket category.",
              hasActiveFilters,
              onClear: clearFilters,
              children: (
                <>
                  <div className="space-y-2">
                    <Label>User role</Label>
                    <Select
                      value={roleFilter}
                      onValueChange={(value) => setRoleFilter(value as RoleFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="tenant">Tenant</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="capitalize">
                            {formatCategory(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ),
            }}
          />

          {filteredItems.length === 0 ? (
            <AdminListEmpty
              title="No support tickets match your filters"
              description="Try All statuses, clearing search, or adjusting filters."
            />
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <AdminDataTable
                columns={ticketColumns}
                data={pagedItems.items}
                getRowId={(ticket) => String(ticket.id)}
                sort={sort}
                onSort={toggleSort}
                onRowClick={setSelected}
              />
            </motion.div>
          )}

          <AdminPagination
            page={pagedItems.page}
            totalPages={pagedItems.totalPages}
            total={pagedItems.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            isFetching={isFetching && !isLoading}
          />
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected?.subject}</SheetTitle>
          </SheetHeader>
          {selected ? (
            <div className="mt-6 flex flex-col gap-4">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selected.body}</p>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={draftStatus}
                  onValueChange={(value) => setDraftStatus(value as SupportTicketStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Admin notes (visible to user on update)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <Button disabled={isPending} onClick={save}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
