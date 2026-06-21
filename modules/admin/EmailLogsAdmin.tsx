"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { Loader2, Mail, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminEmailLogs,
  useResendEmailLog,
} from "@/hooks/use-email-logs";
import type { EmailLogStatus } from "@/schema/email-log";

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

  const query = useMemo(
    () => ({
      q: filters.q.trim() || undefined,
      feature: filters.feature === "all" ? undefined : filters.feature,
      status:
        filters.status === "all"
          ? undefined
          : (filters.status as EmailLogStatus),
      page: filters.page,
      limit: 25,
    }),
    [filters],
  );

  const { data, isLoading, isError } = useAdminEmailLogs(query);
  const resendMutation = useResendEmailLog();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-bold">Email delivery log</h1>
            <p className="text-sm text-muted-foreground">
              Every triggered email, delivery status, and resend history.
            </p>
          </div>
        </div>
        {data ? (
          <Badge variant="secondary">{data.total} total</Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[220px] flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) =>
                void setFilters({ q: e.target.value, page: 1 })
              }
              placeholder="Search recipient, subject, template..."
              className="pl-9"
            />
          </div>
        </div>
        <Select
          value={filters.feature}
          onValueChange={(value) =>
            void setFilters({ feature: value, page: 1 })
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
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
        <Select
          value={filters.status}
          onValueChange={(value) =>
            void setFilters({
              status: value as typeof filters.status,
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_VALUES.map((status) => (
              <SelectItem key={status} value={status}>
                {formatLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          Loading email logs...
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load email logs.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right">Resends</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length ? (
                data.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="capitalize">
                      {formatLabel(row.feature)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {formatLabel(row.triggerEvent)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{row.recipientEmail}</span>
                        {row.recipientRole ? (
                          <span className="text-xs capitalize text-muted-foreground">
                            {row.recipientRole}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {row.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>
                        {row.status}
                      </Badge>
                      {row.errorMessage ? (
                        <p className="mt-1 max-w-[200px] truncate text-xs text-destructive">
                          {row.errorMessage}
                        </p>
                      ) : null}
                      {row.skippedReason ? (
                        <p className="mt-1 max-w-[200px] truncate text-xs text-muted-foreground">
                          {row.skippedReason}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.sentAt
                        ? formatDistanceToNow(new Date(row.sentAt), {
                            addSuffix: true,
                          })
                        : formatDistanceToNow(new Date(row.createdAt), {
                            addSuffix: true,
                          })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.resendCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resendMutation.isPending}
                        onClick={() => resendMutation.mutate(row.id)}
                      >
                        <RefreshCw className="mr-1 size-3.5" />
                        Resend
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No email logs yet. Triggered emails will appear here.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {data && data.total > data.limit ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => void setFilters({ page: Math.max(1, filters.page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= totalPages}
              onClick={() =>
                void setFilters({ page: Math.min(totalPages, filters.page + 1) })
              }
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}