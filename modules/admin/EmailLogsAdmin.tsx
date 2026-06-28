"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  useAdminEmailLogs,
  useResendEmailLog,
} from "@/hooks/use-email-logs";
import type { EmailLog, EmailLogStatus } from "@/schema/email-log";
import { EMAIL_LOG_STATUS_OPTIONS } from "@/lib/admin/status-config";

const PAGE_SIZE = 25;

const STATUS_VALUES = ["sent", "failed", "skipped", "queued"] as const;

const FEATURE_OPTIONS = [
  { value: "all", label: "All features" },
  { value: "service_request", label: "Service requests" },
  { value: "loan_request", label: "Loan requests" },
  { value: "job_consultancy", label: "Job consultancy" },
  { value: "property", label: "Properties" },
  { value: "property_lead", label: "Property leads" },
  { value: "contact", label: "Contact" },
  { value: "auth", label: "Auth" },
];

function statusVariant(status: EmailLogStatus) {
  if (status === "sent") return "default" as const;
  if (status === "failed") return "destructive" as const;
  if (status === "skipped") return "secondary" as const;
  return "outline" as const;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function EmailLogsAdmin() {
  const [filters, setFilters] = useQueryStates({
    q: parseAsString.withDefault(""),
    feature: parseAsString.withDefault("all"),
    status: parseAsStringLiteral([...STATUS_VALUES, "all"]).withDefault("all"),
    page: parseAsInteger.withDefault(1),
  });

  const [search, setSearch] = useState(filters.q);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => setSearch(filters.q), [filters.q]);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (search !== filters.q) {
        void setFilters({ q: search, page: 1 });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [search, filters.q, setFilters]);

  const query = useMemo(
    () => ({
      q: filters.q.trim() || undefined,
      feature: filters.feature === "all" ? undefined : filters.feature,
      status:
        filters.status === "all"
          ? undefined
          : (filters.status as EmailLogStatus),
      page: filters.page,
      limit: PAGE_SIZE,
    }),
    [filters],
  );

  const { data, isLoading, isError, error, isFetching } = useAdminEmailLogs(query);
  const resendMutation = useResendEmailLog();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const hasActiveFilters = filters.feature !== "all";
  const clearFilters = () => void setFilters({ feature: "all", page: 1 });

  const columns = useMemo<ColumnDef<EmailLog, unknown>[]>(
    () => [
      {
        id: "feature",
        header: "Feature",
        meta: { className: "capitalize" },
        cell: ({ row }) => formatLabel(row.original.feature),
      },
      {
        id: "trigger",
        header: "Trigger",
        meta: { className: "capitalize" },
        cell: ({ row }) => formatLabel(row.original.triggerEvent),
      },
      {
        id: "recipient",
        header: "Recipient",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm">{row.original.recipientEmail}</span>
            {row.original.recipientRole ? (
              <span className="text-xs capitalize text-muted-foreground">
                {row.original.recipientRole}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "subject",
        header: "Subject",
        meta: { className: "max-w-[240px] truncate" },
        cell: ({ row }) => row.original.subject,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const log = row.original;
          return (
            <>
              <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
              {log.errorMessage ? (
                <p className="mt-1 max-w-[200px] truncate text-xs text-destructive">
                  {log.errorMessage}
                </p>
              ) : null}
              {log.skippedReason ? (
                <p className="mt-1 max-w-[200px] truncate text-xs text-muted-foreground">
                  {log.skippedReason}
                </p>
              ) : null}
            </>
          );
        },
      },
      {
        id: "sent",
        header: "Sent",
        meta: { className: "whitespace-nowrap text-sm text-muted-foreground" },
        cell: ({ row }) => {
          const log = row.original;
          return log.sentAt
            ? formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })
            : formatDistanceToNow(new Date(log.createdAt), { addSuffix: true });
        },
      },
      {
        id: "resends",
        header: "Resends",
        meta: { className: "text-right tabular-nums" },
        cell: ({ row }) => row.original.resendCount,
      },
      {
        id: "action",
        header: "Action",
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            disabled={resendMutation.isPending}
            onClick={() => resendMutation.mutate(row.original.id)}
          >
            <RefreshCw className="mr-1 size-3.5" />
            Resend
          </Button>
        ),
      },
    ],
    [resendMutation],
  );

  return (
    <AdminListPage
      title="Email delivery log"
      description="Every triggered email, delivery status, and resend history."
      headerAction={
        data ? <Badge variant="secondary">{data.total} total</Badge> : null
      }
      isLoading={isLoading}
      loadingLabel="Loading email logs…"
      isError={isError}
      error={error}
      errorTitle="Could not load email logs"
      toolbar={
        <AdminToolbar
          statusFilter={{
            value: filters.status,
            onChange: (value) =>
              void setFilters({
                status: value as typeof filters.status,
                page: 1,
              }),
            options: EMAIL_LOG_STATUS_OPTIONS,
            totalCount: total,
          }}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search recipient, subject, template…",
          }}
          filterSheet={{
            open: filterSheetOpen,
            onOpenChange: setFilterSheetOpen,
            title: "Filters",
            description: "Narrow by feature.",
            hasActiveFilters,
            onClear: clearFilters,
            children: (
              <div className="space-y-2">
                <Label htmlFor="email-log-feature">Feature</Label>
                <Select
                  value={filters.feature}
                  onValueChange={(value) =>
                    void setFilters({ feature: value, page: 1 })
                  }
                >
                  <SelectTrigger id="email-log-feature">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEATURE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ),
          }}
        />
      }
      isEmpty={items.length === 0}
      emptyTitle="No email logs yet"
      emptyDescription="Triggered emails will appear here. Try clearing search or filters."
      pagination={
        total > PAGE_SIZE
          ? {
              page: filters.page,
              totalPages,
              total,
              pageSize: PAGE_SIZE,
              onPageChange: (nextPage) => void setFilters({ page: nextPage }),
              isFetching: isFetching && !isLoading,
            }
          : undefined
      }
    >
      <AdminDataTable
        columns={columns}
        data={items}
        getRowId={(row) => String(row.id)}
      />
    </AdminListPage>
  );
}
