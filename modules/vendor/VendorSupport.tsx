"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSupportTicket,
  useMySupportTickets,
} from "@/hooks/use-support-tickets";
import { useToast } from "@/hooks/use-toast";
import type { SupportTicketCategory, SupportTicketStatus } from "@/schema/support-ticket";

const CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: "general", label: "General question" },
  { value: "payment_query", label: "Payment / wallet" },
  { value: "complaint", label: "Complaint" },
];

function statusBadge(status: SupportTicketStatus) {
  if (status === "resolved") return <Badge variant="secondary">Resolved</Badge>;
  if (status === "in_progress") return <Badge variant="outline">In progress</Badge>;
  return <Badge>Open</Badge>;
}

export default function VendorSupport() {
  const { data: tickets, isLoading } = useMySupportTickets();
  const { mutate: create, isPending } = useCreateSupportTicket();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState<SupportTicketCategory>("general");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Payment questions, complaints, or anything about your partner account.
          </p>
        </div>
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading support tickets...
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Team reply</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-[360px]">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{t.subject}</span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{t.body}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{t.category.replace("_", " ")}</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                  <TableCell className="max-w-[260px]">
                    {t.adminNotes ? (
                      <span className="line-clamp-2 text-sm">{t.adminNotes}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Awaiting response</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
              {!tickets?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No tickets yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
