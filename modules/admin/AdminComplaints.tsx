"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
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
  useAdminPatchSupportTicket,
  useAdminSupportTickets,
} from "@/hooks/use-support-tickets";
import type { SupportTicket, SupportTicketStatus } from "@/schema/support-ticket";
import { useToast } from "@/hooks/use-toast";

const STATUSES: SupportTicketStatus[] = ["open", "in_progress", "resolved"];

function formatCategory(category: string) {
  return category.replace(/_/g, " ");
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default function AdminComplaints() {
  const { data, isLoading } = useAdminSupportTickets({ limit: 50 });
  const { mutate: patch, isPending } = useAdminPatchSupportTicket();
  const { toast } = useToast();
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [draftStatus, setDraftStatus] = useState<SupportTicketStatus>("open");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (!selected) return;
    setDraftStatus(selected.status);
    setAdminNotes(selected.adminNotes ?? "");
  }, [selected]);

  const save = () => {
    if (!selected) return;
    const input: { status?: SupportTicketStatus; adminNotes?: string | null } = {};
    if (draftStatus !== selected.status) input.status = draftStatus;
    const notes = adminNotes.trim();
    if (notes !== (selected.adminNotes ?? "")) {
      input.adminNotes = notes || null;
    }
    if (Object.keys(input).length === 0) return;

    patch(
      { id: selected.id, input },
      {
        onSuccess: (updated) => {
          setSelected(updated);
          toast({ title: "Ticket updated" });
        },
        onError: (e) =>
          toast({
            title: "Update failed",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Complaints & support</h1>
        <p className="text-sm text-muted-foreground">
          Tickets from partners and other users.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !data?.items.length ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No support tickets yet.
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          {/* Mobile: card list */}
          <ul className="divide-y divide-border md:hidden">
            {data.items.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
                  onClick={() => setSelected(t)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 font-medium text-foreground line-clamp-2">
                      {t.subject}
                    </p>
                    <Badge variant="outline" className="shrink-0 capitalize text-[10px]">
                      {formatStatus(t.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="min-w-0 text-foreground">
                      {t.user?.name ?? `User #${t.userId}`}
                      <span className="ml-1 capitalize text-xs text-muted-foreground">
                        · {t.userRole}
                      </span>
                    </span>
                    <span className="capitalize">{formatCategory(t.category)}</span>
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[12rem]">Subject</TableHead>
                  <TableHead className="min-w-[9rem]">From</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="whitespace-nowrap">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(t)}
                  >
                    <TableCell className="max-w-[240px] font-medium">
                      <span className="line-clamp-2">{t.subject}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.user?.name ?? `User #${t.userId}`}
                      <span className="block text-xs capitalize text-muted-foreground">
                        {t.userRole}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {formatCategory(t.category)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {formatStatus(t.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected?.subject}</SheetTitle>
          </SheetHeader>
          {selected ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selected.body}
              </p>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={draftStatus}
                  onValueChange={(v) => setDraftStatus(v as SupportTicketStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
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
  );
}
