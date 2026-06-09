"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useAdminVendorLeads,
  useAdminPatchVendorLead,
} from "@/hooks/use-vendor-leads";
import type { VendorLead } from "@/schema/vendor-lead";
import type { VendorLeadStatus } from "@/schema/vendor-lead";
import { useToast } from "@/hooks/use-toast";

const STATUSES: VendorLeadStatus[] = [
  "new",
  "accepted",
  "rejected",
  "in_progress",
  "completed",
];

export default function VendorLeadsAdmin() {
  const { data, isLoading } = useAdminVendorLeads({ limit: 50 });
  const { mutate: patchLead, isPending } = useAdminPatchVendorLead();
  const { toast } = useToast();
  const [selected, setSelected] = useState<VendorLead | null>(null);
  const [draftStatus, setDraftStatus] = useState<VendorLeadStatus>("new");
  const [jobAmount, setJobAmount] = useState("");

  useEffect(() => {
    if (!selected) return;
    setDraftStatus(selected.status);
    setJobAmount(selected.jobAmount != null ? String(selected.jobAmount) : "");
  }, [selected]);

  const save = () => {
    if (!selected) return;
    const input: { status?: VendorLeadStatus; jobAmount?: number | null } = {};
    if (draftStatus !== selected.status) input.status = draftStatus;
    const amt = jobAmount.trim() ? Number(jobAmount) : null;
    if (amt !== selected.jobAmount) input.jobAmount = amt;
    if (Object.keys(input).length === 0) return;

    patchLead(
      { id: selected.id, input },
      {
        onSuccess: (updated) => {
          setSelected(updated);
          toast({
            title:
              updated.status === "completed" && updated.jobAmount
                ? "Lead completed — ledger updated"
                : "Lead saved",
          });
        },
        onError: (e) =>
          toast({
            title: "Save failed",
            description: e instanceof Error ? e.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold">Vendor leads</h2>
        <p className="text-sm text-muted-foreground">
          Complete jobs with a job amount to post earnings and commission to the vendor wallet.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Job amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.customerName}</TableCell>
                  <TableCell className="text-xs">#{lead.vendorUserId}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{lead.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {lead.jobAmount != null ? `₹${lead.jobAmount}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setSelected(lead)}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No vendor leads yet. Assign a vendor on a service request.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.customerName}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <p>Phone: {selected.phone}</p>
                {selected.area && <p>Area: {selected.area}</p>}
                {selected.serviceRequestId && (
                  <p className="text-muted-foreground">
                    Service request #{selected.serviceRequestId}
                  </p>
                )}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={draftStatus}
                    onValueChange={(v) => setDraftStatus(v as VendorLeadStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Job amount (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={jobAmount}
                    onChange={(e) => setJobAmount(e.target.value)}
                    placeholder="Required to complete & settle wallet"
                  />
                  <p className="text-xs text-muted-foreground">
                    Commission: {selected.commissionPercent}% deducted on complete.
                  </p>
                </div>
                <Button className="w-full" disabled={isPending} onClick={save}>
                  {isPending ? "Saving…" : "Save"}
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  disabled={isPending || !jobAmount.trim()}
                  onClick={() => {
                    setDraftStatus("completed");
                    const amt = Number(jobAmount);
                    patchLead(
                      {
                        id: selected.id,
                        input: { status: "completed", jobAmount: amt },
                      },
                      {
                        onSuccess: (updated) => {
                          setSelected(updated);
                          toast({ title: "Job completed — wallet entries created" });
                        },
                      },
                    );
                  }}
                >
                  Mark completed & settle
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
