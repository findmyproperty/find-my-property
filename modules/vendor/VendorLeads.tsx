"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, ExternalLink, Loader2, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVendorLeads, usePatchVendorLeadStatus } from "@/hooks/use-vendor-leads";
import type { VendorLeadStatus } from "@/schema/vendor-lead";

function statusVariant(status: VendorLeadStatus) {
  if (status === "new") return "default" as const;
  if (status === "accepted" || status === "in_progress") return "secondary" as const;
  if (status === "completed") return "outline" as const;
  return "destructive" as const;
}

function formatStatus(status: VendorLeadStatus) {
  return status.replace("_", " ");
}

export default function VendorLeads() {
  const { data: leads, isLoading, isError, error } = useVendorLeads();
  const { mutate: patchStatus, isPending } = usePatchVendorLeadStatus();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">Leads</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer enquiries assigned by Find My Property
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading leads...
        </div>
      ) : null}

      {isError ? (
        <div
          className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p>{(error as Error)?.message || "Could not load leads"}</p>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads?.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{lead.customerName}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        {lead.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.area ? (
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {lead.area}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.budget ? (
                      <span className="text-sm">{lead.budget}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(lead.status)} className="capitalize">
                      {formatStatus(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {lead.status === "new" ? (
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
                      ) : null}
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/leads/${lead.id}`}>
                          Details
                          <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!leads?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No leads yet. When admin assigns a service request to you, it will appear here.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
