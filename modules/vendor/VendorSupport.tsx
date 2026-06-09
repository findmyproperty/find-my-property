"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateSupportTicket,
  useMySupportTickets,
} from "@/hooks/use-support-tickets";
import type { SupportTicketCategory } from "@/schema/support-ticket";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: "general", label: "General question" },
  { value: "payment_query", label: "Payment / wallet" },
  { value: "complaint", label: "Complaint" },
];

export default function VendorSupport() {
  const { data: tickets, isLoading } = useMySupportTickets();
  const { mutate: create, isPending } = useCreateSupportTicket();
  const { toast } = useToast();
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
          toast({ title: "Ticket submitted — our team will respond soon" });
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
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Payment questions, complaints, or anything about your partner account.
        </p>
      </div>

      <div className="rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-medium">New ticket</h2>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as SupportTicketCategory)}>
            <SelectTrigger>
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
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        </div>
        <Button disabled={isPending} onClick={submit}>
          {isPending ? "Submitting…" : "Submit ticket"}
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Your tickets</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !tickets?.length ? (
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{t.subject}</span>
                  <Badge variant="outline" className="capitalize">
                    {t.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.body}</p>
                {t.adminNotes ? (
                  <p className="text-sm mt-2 rounded-md bg-muted p-2">
                    <span className="font-medium">Team reply: </span>
                    {t.adminNotes}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
