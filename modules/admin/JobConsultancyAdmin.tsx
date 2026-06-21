"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  ChevronRight,
  Loader2,
  Mail,
  MessageCircle,
  PhoneCall,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminJobConsultancy,
  useAdminJobConsultancyStats,
  useAdminUpdateJobConsultancy,
} from "@/hooks/use-job-consultancy";
import type {
  JobConsultancyDTO,
  JobConsultancyStatus,
  JobConsultancyType,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { CONSULTANCY_META } from "@/modules/job-consultancy/job-consultancy-config";

function formatPhoneForLink(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

const STATUS_PIPELINE: JobConsultancyStatus[] = [
  "new",
  "contacted",
  "screening",
  "interview_scheduled",
  "placed",
];

const TERMINAL_STATUSES: JobConsultancyStatus[] = ["rejected", "cancelled"];

const STATUS_VALUES: JobConsultancyStatus[] = [
  ...STATUS_PIPELINE,
  ...TERMINAL_STATUSES,
];

const TYPE_VALUES: JobConsultancyType[] = ["it", "non_it", "customer_support"];

const STATUS_META: Record<
  JobConsultancyStatus,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
  },
  contacted: {
    label: "Contacted",
    className:
      "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300",
  },
  screening: {
    label: "Screening",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  },
  interview_scheduled: {
    label: "Interview",
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  placed: {
    label: "Placed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/15 dark:text-zinc-300",
  },
};

const filterParsers = {
  type: parseAsStringLiteral(["all", ...TYPE_VALUES] as const).withDefault("all"),
  status: parseAsStringLiteral(["all", ...STATUS_VALUES] as const).withDefault(
    "all",
  ),
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

function getNextStatus(current: JobConsultancyStatus): JobConsultancyStatus | null {
  const idx = STATUS_PIPELINE.indexOf(current);
  if (idx < 0 || idx >= STATUS_PIPELINE.length - 1) return null;
  return STATUS_PIPELINE[idx + 1];
}

export default function JobConsultancyAdmin() {
  const [{ type, status, q, page }, setQuery] = useQueryStates(filterParsers, {
    history: "replace",
    shallow: true,
  });

  const [searchDraft, setSearchDraft] = useState(q);
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
      consultancyType: type === "all" ? undefined : type,
      status: status === "all" ? undefined : status,
      q: q || undefined,
      page,
      limit: 20,
    }),
    [type, status, q, page],
  );

  const { data, isLoading, isError } = useAdminJobConsultancy(listQuery);
  const { data: stats } = useAdminJobConsultancyStats();
  const updateMutation = useAdminUpdateJobConsultancy();

  const [selected, setSelected] = useState<JobConsultancyDTO | null>(null);
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    if (selected) {
      setInternalNotes(selected.internalNotes ?? "");
    }
  }, [selected]);

  const openRow = (row: JobConsultancyDTO) => {
    setSelected(row);
    setInternalNotes(row.internalNotes ?? "");
  };

  const changeStatus = async (next: JobConsultancyStatus) => {
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Job Consultancy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            IT, Non IT &amp; Customer Support — click a status to update instantly.
          </p>
        </div>
        {stats ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.openTotal}</span>{" "}
            open inquiries
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or phone…"
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </div>
        <Select
          value={type}
          onValueChange={(v) =>
            setQuery({ type: v as "all" | JobConsultancyType, page: 1 })
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Consultancy type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPE_VALUES.map((t) => (
              <SelectItem key={t} value={t}>
                {CONSULTANCY_META[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) =>
            setQuery({ status: v as "all" | JobConsultancyStatus, page: 1 })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_VALUES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(type !== "all" || status !== "all" || q) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchDraft("");
              setQuery({ type: "all", status: "all", q: "", page: 1 });
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-destructive">
            Could not load job consultancy requests.
          </p>
        ) : !data?.items.length ? (
          <p className="py-16 text-center text-muted-foreground">
            No requests match your filters.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((r) => {
                const meta = CONSULTANCY_META[r.consultancyType];
                const Icon = meta.icon;
                const s = STATUS_META[r.status] ?? STATUS_META.new;
                return (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => openRow(r)}
                  >
                    <TableCell>
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.phone}</p>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.city || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.className}>
                        {s.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(r.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {data && data.total > data.limit ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {data.page} · {data.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setQuery({ page: page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * data.limit >= data.total}
              onClick={() => setQuery({ page: page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {CONSULTANCY_META[selected.consultancyType].label} · #
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
                    <span className="text-muted-foreground">Consultancy type</span>
                    <span className="font-medium">
                      {CONSULTANCY_META[selected.consultancyType].label}
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
                      Close inquiry
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
                    Tap any status to update immediately. The candidate is emailed when their email is on file.
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
    </div>
  );
}