"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2, AlertCircle, Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVendorLeads, usePatchVendorLeadStatus } from "@/hooks/use-vendor-leads";

function statusVariant(status: string) {
  if (status === "new") return "default" as const;
  if (status === "accepted" || status === "in_progress") return "secondary" as const;
  if (status === "completed") return "outline" as const;
  return "destructive" as const;
}

export default function VendorLeads() {
  const { data: leads, isLoading, isError, error } = useVendorLeads();
  const { mutate: patchStatus, isPending } = usePatchVendorLeadStatus();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">Leads</h2>
        <p className="text-sm text-muted-foreground">
          Customer enquiries assigned by Find My Property
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading leads…</span>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3 text-sm" role="alert">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p>{(error as Error)?.message || "Could not load leads"}</p>
        </div>
      )}

      {!isLoading && !isError && leads?.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">
          No leads yet. When admin assigns a service request to you, it will appear here.
        </div>
      )}

      <div className="space-y-3">
        {leads?.map((lead) => (
          <div
            key={lead.id}
            className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-foreground">{lead.customerName}</h3>
                <Badge variant={statusVariant(lead.status)}>{lead.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {lead.phone}
                {lead.area ? (
                  <>
                    <span className="mx-1">·</span>
                    <MapPin className="w-3 h-3 inline" />
                    {lead.area}
                  </>
                ) : null}
              </p>
              {lead.budget ? (
                <p className="text-xs text-muted-foreground mt-0.5">Budget: {lead.budget}</p>
              ) : null}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {lead.status === "new" && (
                <>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => patchStatus({ id: lead.id, status: "accepted" })}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => patchStatus({ id: lead.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button size="sm" variant="secondary" asChild>
                <Link href={`/leads/${lead.id}`}>Details</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
