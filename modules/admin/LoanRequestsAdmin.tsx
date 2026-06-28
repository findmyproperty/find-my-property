"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  ChevronRight,
  Mail,
  MessageCircle,
  PhoneCall,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminListPage } from "@/components/admin/admin-list-page";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import {
  useAdminLoanRequestStats,
  useAdminLoanRequests,
  useAdminUpdateLoanRequest,
} from "@/hooks/use-loan-requests";
import type {
  LoanRequestDTO,
  LoanRequestStatus,
  LoanType,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { LOAN_META } from "@/modules/loans/loan-config";
import { adminStatusOptionsToMap, LOAN_REQUEST_STATUS_OPTIONS } from "@/lib/admin/status-config";

function formatPhoneForLink(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

const STATUS_PIPELINE: LoanRequestStatus[] = [
  "new",
  "contacted",
  "documents_pending",
  "under_review",
  "approved",
  "disbursed",
];

const TERMINAL_STATUSES: LoanRequestStatus[] = ["rejected", "cancelled"];

const STATUS_VALUES: LoanRequestStatus[] = [
  ...STATUS_PIPELINE,
  ...TERMINAL_STATUSES,
];

const LOAN_VALUES: LoanType[] = [
  "home_loan",
  "personal_loan",
  "vehicle_loan",
  "mortgage",
];

const STATUS_META = adminStatusOptionsToMap(LOAN_REQUEST_STATUS_OPTIONS);

const filterParsers = {
  type: parseAsStringLiteral(["all", ...LOAN_VALUES] as const).withDefault("all"),
  status: parseAsStringLiteral(["all", ...STATUS_VALUES] as const).withDefault(
    "all",
  ),
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

function getNextStatus(current: LoanRequestStatus): LoanRequestStatus | null {
  const idx = STATUS_PIPELINE.indexOf(current);
  if (idx < 0 || idx >= STATUS_PIPELINE.length - 1) return null;
  return STATUS_PIPELINE[idx + 1];
}

export default function LoanRequestsAdmin() {
  const [{ type, status, q, page }, setQuery] = useQueryStates(filterParsers, {
    history: "replace",
    shallow: true,
  });

  const [searchDraft, setSearchDraft] = useState(q);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchDraft !== q) {
        setQuery({ q: searchDraft, page: 1 });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchDraft, q, setQuery]);

  const listQuery = useMemo(
    () => ({
      loanType: type === "all" ? undefined : type,
      status: status === "all" ? undefined : status,
      q: q || undefined,
      page,
      limit: 20,
    }),
    [type, status, q, page],
  );

  const { data, isLoading, isError, error, isFetching } = useAdminLoanRequests(listQuery);
  const { data: stats } = useAdminLoanRequestStats();
  const updateMutation = useAdminUpdateLoanRequest();

  const [selected, setSelected] = useState<LoanRequestDTO | null>(null);
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    if (selected) {
      setInternalNotes(selected.internalNotes ?? "");
    }
  }, [selected]);

  const openRow = (row: LoanRequestDTO) => {
    setSelected(row);
    setInternalNotes(row.internalNotes ?? "");
  };

  const changeStatus = async (next: LoanRequestStatus) => {
    if (!selected || updateMutation.isPending) return;
    const updated = await updateMutation.mutateAsync({
      id: selected.id,
      input: { status: next },
    });
    setSelected(updated);
  };

  const saveNotes = async () => {
    if (!selected) return;
    const updated = await updateMutation.mutateAsync({
      id: selected.id,
      input: { internalNotes },
    });
    setSelected(updated);
  };

  const nextStatus = selected ? getNextStatus(selected.status) : null;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasActiveFilters = type !== "all";
  const clearFilters = () => setQuery({ type: "all", page: 1 });

  const columns = useMemo<ColumnDef<LoanRequestDTO, unknown>[]>(
    () => [
      {
        id: "applicant",
        header: "Applicant",
        meta: { className: "min-w-[10rem]" },
        cell: ({ row }) => (
          <>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.phone}</p>
          </>
        ),
      },
      {
        id: "type",
        header: "Type",
        meta: { className: "min-w-[9rem]" },
        cell: ({ row }) => {
          const loanMeta = LOAN_META[row.original.loanType];
          const LoanIcon = loanMeta.icon;
          return (
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <LoanIcon className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <span className="whitespace-nowrap">{loanMeta.label}</span>
            </span>
          );
        },
      },
      {
        id: "city",
        header: "City",
        meta: { className: "text-sm text-muted-foreground" },
        cell: ({ row }) => row.original.city || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = STATUS_META[row.original.status] ?? STATUS_META.new;
          return (
            <Badge variant="outline" className={s.className}>
              {s.label}
            </Badge>
          );
        },
      },
      {
        id: "submitted",
        header: "Submitted",
        meta: { className: "whitespace-nowrap text-sm text-muted-foreground" },
        cell: ({ row }) =>
          formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true }),
      },
    ],
    [],
  );

  return (
    <>
      <AdminListPage
        title="Loan Requests"
        description="Manage loan inquiries — click a status to update instantly."
        headerAction={
          stats ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.openTotal}</span>{" "}
              open applications
            </p>
          ) : null
        }
        isLoading={isLoading}
        loadingLabel="Loading loan requests…"
        isError={isError}
        error={error}
        errorTitle="Could not load loan requests"
        toolbar={
          <AdminToolbar
            statusFilter={{
              value: status,
              onChange: (value) =>
                setQuery({ status: value as typeof status, page: 1 }),
              options: LOAN_REQUEST_STATUS_OPTIONS,
              totalCount: total,
            }}
            search={{
              value: searchDraft,
              onChange: setSearchDraft,
              placeholder: "Search name or phone…",
            }}
            filterSheet={{
              open: filterSheetOpen,
              onOpenChange: setFilterSheetOpen,
              title: "Filters",
              description: "Narrow by loan type.",
              hasActiveFilters,
              onClear: clearFilters,
              children: (
                <div className="space-y-2">
                  <Label htmlFor="loan-type-filter">Loan type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) =>
                      setQuery({ type: v as typeof type, page: 1 })
                    }
                  >
                    <SelectTrigger id="loan-type-filter">
                      <SelectValue placeholder="Loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {LOAN_VALUES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {LOAN_META[t].label}
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
        emptyTitle="No loan requests match your filters"
        emptyDescription="Try All statuses, clearing search, or adjusting filters."
        pagination={
          total > pageSize
            ? {
                page,
                totalPages,
                total,
                pageSize,
                onPageChange: (nextPage) => setQuery({ page: nextPage }),
                isFetching: isFetching && !isLoading,
              }
            : undefined
        }
      >
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
          {items.map((r) => {
            const loanMeta = LOAN_META[r.loanType];
            const LoanIcon = loanMeta.icon;
            const s = STATUS_META[r.status] ?? STATUS_META.new;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
                  onClick={() => openRow(r)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.phone}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 text-[10px]", s.className)}
                    >
                      {s.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <LoanIcon className="h-4 w-4 text-primary" aria-hidden />
                      </span>
                      <span className="text-foreground">{loanMeta.label}</span>
                    </span>
                    {r.city ? <span>{r.city}</span> : null}
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(r.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <AdminDataTable
          className="hidden md:block"
          columns={columns}
          data={items}
          getRowId={(row) => String(row.id)}
          onRowClick={openRow}
        />
      </AdminListPage>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {LOAN_META[selected.loanType].label} · #
                  {selected.id}
                </SheetDescription>
              </SheetHeader>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-5"
              >
                <section className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${formatPhoneForLink(selected.phone)}`}>
                      <PhoneCall className="mr-1.5 h-3.5 w-3.5" />
                      Call
                    </a>
                  </Button>
                  {selected.email ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${selected.email}`}>
                        <Mail className="mr-1.5 h-3.5 w-3.5" />
                        Email
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://wa.me/${formatPhoneForLink(selected.phone).replace(/^\+/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  </Button>
                </section>

                <section className="space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Loan type</span>
                    <span className="font-medium">
                      {LOAN_META[selected.loanType].label}
                    </span>
                  </div>
                  {selected.email ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Email</span>
                      <span>{selected.email}</span>
                    </div>
                  ) : null}
                  {selected.city ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">City</span>
                      <span>{selected.city}</span>
                    </div>
                  ) : null}
                  {selected.details.notes ? (
                    <p className="border-t border-border pt-2 text-muted-foreground">
                      {selected.details.notes}
                    </p>
                  ) : null}
                </section>

                <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Application status
                    </h3>
                    {nextStatus ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={updateMutation.isPending}
                        onClick={() => void changeStatus(nextStatus)}
                      >
                        Advance to {STATUS_META[nextStatus].label}
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_PIPELINE.map((s) => {
                      const meta = STATUS_META[s];
                      const isActive = selected.status === s;
                      const pipelineIdx = STATUS_PIPELINE.indexOf(s);
                      const currentIdx = STATUS_PIPELINE.indexOf(selected.status);
                      const isPast =
                        currentIdx >= 0 && pipelineIdx < currentIdx;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={updateMutation.isPending}
                          onClick={() => void changeStatus(s)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            isActive
                              ? meta.className
                              : isPast
                                ? "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                                : "border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          )}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <span className="w-full text-xs text-muted-foreground">
                      Close application
                    </span>
                    {TERMINAL_STATUSES.map((s) => {
                      const meta = STATUS_META[s];
                      const isActive = selected.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={updateMutation.isPending}
                          onClick={() => void changeStatus(s)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            isActive
                              ? meta.className
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Tap any status to update immediately. The customer is emailed when their email is on file.
                  </p>
                </section>

                <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Internal notes
                  </h3>
                  <Textarea
                    rows={4}
                    placeholder="Visible only to admins."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => void saveNotes()}
                    disabled={
                      updateMutation.isPending ||
                      internalNotes === (selected.internalNotes ?? "")
                    }
                  >
                    {updateMutation.isPending ? "Saving…" : "Save notes"}
                  </Button>
                </section>

                <Button variant="ghost" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </motion.div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}