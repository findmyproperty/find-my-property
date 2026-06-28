"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import {
  useCreateSupportTicket,
  useMySupportTickets,
} from "@/hooks/use-support-tickets";
import { useToast } from "@/hooks/use-toast";
import { SUPPORT_TICKET_STATUS_OPTIONS } from "@/lib/admin/status-config";
import type {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketStatus,
} from "@/schema/support-ticket";

const PAGE_SIZE = 20;

const CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: "general", label: "General question" },
  { value: "payment_query", label: "Payment / wallet" },
  { value: "complaint", label: "Complaint" },
];

type StatusFilter = "all" | SupportTicketStatus;
type TicketSortKey = "ticket" | "category" | "status" | "updatedAt";

function ticketSearchText(ticket: SupportTicket): string {
  return [
    ticket.subject,
    ticket.body,
    ticket.category,
    ticket.adminNotes,
    String(ticket.id),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function compareTickets(a: SupportTicket, b: SupportTicket, key: TicketSortKey): number {
  switch (key) {
    case "ticket":
      return compareStrings(a.subject, b.subject);
    case "category":
      return compareStrings(a.category, b.category);
    case "status":
      return compareStrings(a.status, b.status);
    case "updatedAt":
      return compareDates(a.updatedAt, b.updatedAt);
  }
}

export default function VendorSupport() {
  const { data: tickets, isLoading, isError, error } = useMySupportTickets();
  const { mutate: create, isPending } = useCreateSupportTicket();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState<SupportTicketCategory>("general");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const allTickets = useMemo(() => tickets ?? [], [tickets]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
  } = useAdminListControls<TicketSortKey>({
    defaultSort: { key: "updatedAt", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [statusFilter],
  });

  const statusCounts = useMemo(
    () =>
      SUPPORT_TICKET_STATUS_OPTIONS.reduce(
        (counts, option) => {
          counts[option.value] = allTickets.filter((ticket) => ticket.status === option.value)
            .length;
          return counts;
        },
        {} as Record<string, number>,
      ),
    [allTickets],
  );

  const filteredTickets = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    const filtered = allTickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (q && !ticketSearchText(ticket).includes(q)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const result = compareTickets(a, b, sort.key);
      return sort.dir === "asc" ? result : -result;
    });
  }, [allTickets, debouncedSearch, sort.dir, sort.key, statusFilter]);

  const pagedTickets = useMemo(
    () => paginateItems(filteredTickets, page, PAGE_SIZE),
    [filteredTickets, page],
  );

  const columns = useMemo<ColumnDef<SupportTicket, unknown>[]>(
    () => [
      {
        id: "ticket",
        header: "Ticket",
        meta: { sortKey: "ticket", className: "max-w-[360px]" },
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{row.original.subject}</span>
            <span className="line-clamp-2 text-xs text-muted-foreground">{row.original.body}</span>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        meta: { sortKey: "category", className: "capitalize" },
        cell: ({ row }) => row.original.category.replace("_", " "),
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
        id: "reply",
        header: "Team reply",
        meta: { className: "max-w-[260px]" },
        cell: ({ row }) =>
          row.original.adminNotes ? (
            <span className="line-clamp-2 text-sm">{row.original.adminNotes}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Awaiting response</span>
          ),
      },
      {
        id: "updated",
        header: "Updated",
        meta: {
          sortKey: "updatedAt",
          className: "whitespace-nowrap text-right text-xs text-muted-foreground",
        },
        cell: ({ row }) =>
          formatDistanceToNow(new Date(row.original.updatedAt), { addSuffix: true }),
      },
    ],
    [],
  );

  const submit = () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Subject and message are required", variant: "destructive" });
      return;
    }

    create(
      { category, subject: subject.trim(), body: body.trim() },
      {
        onSuccess: () => {
          setSubject("");
          setBody("");
          setDialogOpen(false);
          toast({ title: "Ticket submitted - our team will respond soon" });
        },
        onError: (e) =>
          toast({
            title: "Could not submit",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <AdminListPage
      title="Support"
      description="Payment questions, complaints, or anything about your partner account."
      headerAction={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              New ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New support ticket</DialogTitle>
              <DialogDescription>
                Share the issue clearly so the team can respond with the right context.
              </DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="support-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as SupportTicketCategory)}
                >
                  <SelectTrigger id="support-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="support-subject">Subject</Label>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="support-message">Message</Label>
                <Textarea
                  id="support-message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Submitting..." : "Submit ticket"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
      isLoading={isLoading}
      loadingLabel="Loading support tickets…"
      isError={isError}
      error={error}
      errorTitle="Could not load support tickets"
      isEmpty={!isLoading && !isError && filteredTickets.length === 0}
      emptyTitle={allTickets.length === 0 ? "No tickets yet" : "No tickets match your filters"}
      emptyDescription={
        allTickets.length === 0
          ? "Submit a ticket when you need help from our team."
          : "Try All statuses or clearing search."
      }
      toolbar={
        <AdminToolbar
          statusFilter={{
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as StatusFilter),
            options: SUPPORT_TICKET_STATUS_OPTIONS,
            counts: statusCounts,
            totalCount: allTickets.length,
          }}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search subject, message, or category…",
          }}
        />
      }
      pagination={{
        page: pagedTickets.page,
        totalPages: pagedTickets.totalPages,
        total: pagedTickets.total,
        pageSize: PAGE_SIZE,
        onPageChange: setPage,
      }}
    >
      <AdminDataTable
        columns={columns}
        data={pagedTickets.items}
        getRowId={(row) => String(row.id)}
        sort={sort}
        onSort={toggleSort}
      />
    </AdminListPage>
  );
}
