"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import { Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminListPage } from "@/components/admin/admin-list-page";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import {
  compareDates,
  compareStrings,
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls";
import { useLeads, useUpdateLeadStatus } from "@/hooks/use-leads";
import { AGENT_LEAD_STATUS_OPTIONS } from "@/lib/admin/status-config";
import type { Lead, LeadStatus } from "@/lib/api";

const PAGE_SIZE = 20;

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

type StatusFilter = "all" | LeadStatus;
type LeadSortKey = "tenant" | "property" | "status" | "createdAt";

function statusBadgeVariant(status: LeadStatus) {
  if (status === "new") return "default" as const;
  if (status === "contacted") return "secondary" as const;
  return "outline" as const;
}

function leadSearchText(lead: Lead): string {
  return [
    lead.tenantName,
    lead.tenantEmail,
    lead.tenantPhone,
    lead.propertyTitle,
    lead.message,
    String(lead.id),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function compareLeads(a: Lead, b: Lead, key: LeadSortKey): number {
  switch (key) {
    case "tenant":
      return compareStrings(a.tenantName, b.tenantName);
    case "property":
      return compareStrings(a.propertyTitle, b.propertyTitle);
    case "status":
      return compareStrings(a.status, b.status);
    case "createdAt":
      return compareDates(a.createdAt, b.createdAt);
  }
}

const AgentLeads = () => {
  const { data: leads, isLoading, isError, error } = useLeads();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateLeadStatus();
  const allLeads = useMemo(() => leads ?? [], [leads]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
  } = useAdminListControls<LeadSortKey>({
    defaultSort: { key: "createdAt", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [statusFilter],
  });

  const statusCounts = useMemo(
    () =>
      AGENT_LEAD_STATUS_OPTIONS.reduce(
        (counts, option) => {
          counts[option.value] = allLeads.filter((lead) => lead.status === option.value).length;
          return counts;
        },
        {} as Record<string, number>,
      ),
    [allLeads],
  );

  const filteredLeads = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    const filtered = allLeads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (q && !leadSearchText(lead).includes(q)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const result = compareLeads(a, b, sort.key);
      return sort.dir === "asc" ? result : -result;
    });
  }, [allLeads, debouncedSearch, sort.dir, sort.key, statusFilter]);

  const pagedLeads = useMemo(
    () => paginateItems(filteredLeads, page, PAGE_SIZE),
    [filteredLeads, page],
  );

  const columns = useMemo<ColumnDef<Lead, unknown>[]>(
    () => [
      {
        id: "tenant",
        header: "Tenant",
        meta: { sortKey: "tenant" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{row.original.tenantName}</span>
            <span className="text-xs text-muted-foreground">Lead #{row.original.id}</span>
          </div>
        ),
      },
      {
        id: "property",
        header: "Property",
        meta: { sortKey: "property", className: "max-w-[360px]" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{row.original.propertyTitle}</span>
            {row.original.message ? (
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {row.original.message}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">No message added</span>
            )}
          </div>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3 shrink-0" />
              {row.original.tenantEmail}
            </span>
            {row.original.tenantPhone ? (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 shrink-0" />
                {row.original.tenantPhone}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        meta: { sortKey: "status" },
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="flex flex-col gap-2">
              <Badge variant={statusBadgeVariant(lead.status)} className="w-fit capitalize">
                {lead.status}
              </Badge>
              <Select
                value={lead.status}
                disabled={isUpdating}
                onValueChange={(value: LeadStatus) => {
                  if (value !== lead.status) {
                    updateStatus({ id: lead.id, status: value });
                  }
                }}
              >
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
      {
        id: "created",
        header: "Created",
        meta: {
          sortKey: "createdAt",
          className: "whitespace-nowrap text-right text-xs text-muted-foreground",
        },
        cell: ({ row }) =>
          formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true }),
      },
    ],
    [isUpdating, updateStatus],
  );

  return (
    <AdminListPage
      title="Leads"
      description="Enquiries from tenants interested in your listings"
      isLoading={isLoading}
      loadingLabel="Loading leads…"
      isError={isError}
      error={error}
      errorTitle="Could not load leads"
      isEmpty={!isLoading && !isError && filteredLeads.length === 0}
      emptyTitle={
        allLeads.length === 0
          ? "No enquiries yet"
          : "No leads match your filters"
      }
      emptyDescription={
        allLeads.length === 0
          ? "When tenants request contact on your listings, they will appear here."
          : "Try All statuses or clearing search."
      }
      toolbar={
        <AdminToolbar
          statusFilter={{
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as StatusFilter),
            options: AGENT_LEAD_STATUS_OPTIONS,
            counts: statusCounts,
            totalCount: allLeads.length,
          }}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search tenant, property, message, or ID…",
          }}
        />
      }
      pagination={{
        page: pagedLeads.page,
        totalPages: pagedLeads.totalPages,
        total: pagedLeads.total,
        pageSize: PAGE_SIZE,
        onPageChange: setPage,
      }}
    >
      <AdminDataTable
        columns={columns}
        data={pagedLeads.items}
        getRowId={(row) => String(row.id)}
        sort={sort}
        onSort={toggleSort}
      />
    </AdminListPage>
  );
};

export default AgentLeads;
