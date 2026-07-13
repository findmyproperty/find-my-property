"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import { CalendarClock, ExternalLink, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminListPage } from "@/components/admin/admin-list-page";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import {
  compareDates,
  compareStrings,
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls";
import { useVendorLeads, usePatchVendorLeadStatus } from "@/hooks/use-vendor-leads";
import { VENDOR_LEAD_STATUS_OPTIONS } from "@/lib/admin/status-config";
import {
  formatVendorLeadJobAmount,
  formatVendorLeadPreferredDate,
  getVendorLeadServiceSummary,
} from "@/lib/vendor/lead-display";
import type { VendorLead, VendorLeadStatus } from "@/schema/vendor-lead";
import { canVendorAcceptOrRejectLead } from "@/schema/vendor-lead";

const PAGE_SIZE = 20;

type StatusFilter = "all" | VendorLeadStatus;
type VendorLeadSortKey =
  | "customer"
  | "service"
  | "area"
  | "preferredDate"
  | "jobAmount"
  | "status"
  | "createdAt";

function vendorLeadSearchText(lead: VendorLead): string {
  const service = getVendorLeadServiceSummary(lead.requirement);
  return [
    lead.customerName,
    lead.area,
    lead.status,
    service.title,
    service.detail,
    formatVendorLeadPreferredDate(lead.preferredDate),
    lead.jobAmount != null ? String(lead.jobAmount) : "",
    String(lead.id),
    lead.serviceRequestId != null ? String(lead.serviceRequestId) : "",
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function compareVendorLeads(
  a: VendorLead,
  b: VendorLead,
  key: VendorLeadSortKey,
): number {
  switch (key) {
    case "customer":
      return compareStrings(a.customerName, b.customerName);
    case "service":
      return compareStrings(
        getVendorLeadServiceSummary(a.requirement).title,
        getVendorLeadServiceSummary(b.requirement).title,
      );
    case "area":
      return compareStrings(a.area ?? "", b.area ?? "");
    case "preferredDate":
      return compareStrings(a.preferredDate ?? "", b.preferredDate ?? "");
    case "jobAmount":
      return (a.jobAmount ?? 0) - (b.jobAmount ?? 0);
    case "status":
      return compareStrings(a.status, b.status);
    case "createdAt":
      return compareDates(a.createdAt, b.createdAt);
  }
}

export default function VendorLeads() {
  const { data: leads, isLoading, isError, error } = useVendorLeads();
  const { mutate: patchStatus, isPending } = usePatchVendorLeadStatus();
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
  } = useAdminListControls<VendorLeadSortKey>({
    defaultSort: { key: "createdAt", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [statusFilter],
  });

  const statusCounts = useMemo(
    () =>
      VENDOR_LEAD_STATUS_OPTIONS.reduce(
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
      if (q && !vendorLeadSearchText(lead).includes(q)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const result = compareVendorLeads(a, b, sort.key);
      return sort.dir === "asc" ? result : -result;
    });
  }, [allLeads, debouncedSearch, sort.dir, sort.key, statusFilter]);

  const pagedLeads = useMemo(
    () => paginateItems(filteredLeads, page, PAGE_SIZE),
    [filteredLeads, page],
  );

  const columns = useMemo<ColumnDef<VendorLead, unknown>[]>(
    () => [
      {
        id: "customer",
        header: "Customer",
        meta: { sortKey: "customer" },
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{lead.customerName}</span>
              <span className="text-xs text-muted-foreground">
                Lead #{lead.id}
                {lead.serviceRequestId ? ` · Request #${lead.serviceRequestId}` : ""}
              </span>
              {lead.status === "pending_admin_review" ? (
                <span className="text-xs text-amber-700">Awaiting admin approval</span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "service",
        header: "Service",
        meta: { sortKey: "service" },
        cell: ({ row }) => {
          const summary = getVendorLeadServiceSummary(row.original.requirement);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-sm">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {summary.title}
              </span>
              {summary.detail ? (
                <span className="text-xs text-muted-foreground">{summary.detail}</span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "area",
        header: "Area",
        meta: { sortKey: "area" },
        cell: ({ row }) =>
          row.original.area ? (
            <span className="flex items-center gap-1 text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {row.original.area}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        id: "preferred",
        header: "Preferred",
        meta: { sortKey: "preferredDate", className: "whitespace-nowrap" },
        cell: ({ row }) => {
          const label = formatVendorLeadPreferredDate(row.original.preferredDate);
          const isFlexible = label === "Flexible";
          return (
            <span className="flex items-center gap-1 text-sm">
              <CalendarClock
                className={`h-3.5 w-3.5 shrink-0 ${isFlexible ? "text-muted-foreground" : "text-primary"}`}
                aria-hidden
              />
              <span className={isFlexible ? "text-muted-foreground" : "text-foreground"}>
                {label}
              </span>
            </span>
          );
        },
      },
      {
        id: "jobAmount",
        header: "Job amount",
        meta: { sortKey: "jobAmount", className: "whitespace-nowrap" },
        cell: ({ row }) => {
          const amount = formatVendorLeadJobAmount(row.original.jobAmount);
          const hasAmount = amount !== "—";
          return (
            <span
              className={`text-sm ${hasAmount ? "font-medium text-foreground" : "text-muted-foreground"}`}
            >
              {amount}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        meta: { sortKey: "status" },
        cell: ({ row }) => (
          <AdminStatusBadge
            status={row.original.status}
            options={VENDOR_LEAD_STATUS_OPTIONS}
          />
        ),
      },
      {
        id: "created",
        header: "Created",
        meta: {
          sortKey: "createdAt",
          className: "whitespace-nowrap text-xs text-muted-foreground",
        },
        cell: ({ row }) =>
          formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true }),
      },
      {
        id: "action",
        header: "Action",
        meta: { className: "text-right" },
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="flex justify-end gap-2">
              {canVendorAcceptOrRejectLead(lead.status) ? (
                <>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => patchStatus({ id: lead.id, status: "accepted" })}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => patchStatus({ id: lead.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                </>
              ) : null}
              <Button size="sm" variant="secondary" asChild>
                <Link href={`/leads/${lead.id}`}>
                  Details
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          );
        },
      },
    ],
    [isPending, patchStatus],
  );

  return (
    <AdminListPage
      title="Leads"
      description="Customer enquiries assigned by Find My Property"
      isLoading={isLoading}
      loadingLabel="Loading leads…"
      isError={isError}
      error={error}
      errorTitle="Could not load leads"
      isEmpty={!isLoading && !isError && filteredLeads.length === 0}
      emptyTitle={allLeads.length === 0 ? "No leads yet" : "No leads match your filters"}
      emptyDescription={
        allLeads.length === 0
          ? "When admin assigns a service request to you, it will appear here."
          : "Try All statuses or clearing search."
      }
      toolbar={
        <AdminToolbar
          statusFilter={{
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as StatusFilter),
            options: VENDOR_LEAD_STATUS_OPTIONS,
            counts: statusCounts,
            totalCount: allLeads.length,
          }}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search customer, service, area, or ID…",
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
}
