"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  useVendorLead,
  usePatchVendorLeadStatus,
  useAddVendorLeadUpdate,
} from "@/hooks/use-vendor-leads";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const MILESTONES = [
  "Customer contacted",
  "Site visit done",
  "Work started",
  "Work completed",
];

export default function VendorLeadDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: lead, isLoading } = useVendorLead(Number.isFinite(id) ? id : null);
  const { mutate: patchStatus, isPending: patching } = usePatchVendorLeadStatus();
  const { mutate: addUpdate, isPending: adding } = useAddVendorLeadUpdate();
  const { toast } = useToast();
  const [milestone, setMilestone] = useState(MILESTONES[0]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await api.uploadFile(file);
      setPhotoUrls((prev) => [...prev, url]);
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !lead) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/leads">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to leads
        </Link>
      </Button>

      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{lead.customerName}</h1>
          <Badge>{lead.status.replace("_", " ")}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Phone: {lead.phone}</p>
        {lead.area && <p className="text-sm">Area: {lead.area}</p>}
        {lead.budget && <p className="text-sm">Budget: {lead.budget}</p>}
        {lead.requirement && (
          <p className="text-sm whitespace-pre-wrap">{lead.requirement}</p>
        )}
        {lead.status === "new" && (
          <div className="flex gap-2 pt-2">
            <Button
              disabled={patching}
              onClick={() => patchStatus({ id: lead.id, status: "accepted" })}
            >
              Accept lead
            </Button>
            <Button
              variant="outline"
              disabled={patching}
              onClick={() => patchStatus({ id: lead.id, status: "rejected" })}
            >
              Reject
            </Button>
          </div>
        )}
        {lead.status === "accepted" && (
          <Button
            disabled={patching}
            onClick={() => patchStatus({ id: lead.id, status: "in_progress" })}
          >
            Mark in progress
          </Button>
        )}
      </div>

      {lead.status !== "new" && lead.status !== "rejected" && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h2 className="font-semibold">Work update</h2>
          <div className="space-y-2">
            <Label>Milestone</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
            >
              {MILESTONES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Photos</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
            {photoUrls.length > 0 && (
              <p className="text-xs text-muted-foreground">{photoUrls.length} file(s) attached</p>
            )}
          </div>
          <Button
            disabled={adding}
            onClick={() => {
              addUpdate(
                { id: lead.id, milestone, note: note || undefined, photoUrls },
                {
                  onSuccess: () => {
                    setNote("");
                    setPhotoUrls([]);
                    toast({ title: "Update posted" });
                  },
                },
              );
            }}
          >
            Post update
          </Button>
        </div>
      )}

      {lead.updates && lead.updates.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Timeline</h2>
          {lead.updates.map((u) => (
            <div key={u.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{u.milestone}</p>
              {u.note && <p className="text-muted-foreground mt-1">{u.note}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(u.createdAt), "PPp")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
