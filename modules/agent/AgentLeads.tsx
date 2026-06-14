"use client";

import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Loader2, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useLeads, useUpdateLeadStatus } from "@/hooks/use-leads";
import type { LeadStatus } from "@/lib/api";

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

function statusBadgeVariant(status: LeadStatus) {
  if (status === "new") return "default" as const;
  if (status === "contacted") return "secondary" as const;
  return "outline" as const;
}

const AgentLeads = () => {
  const { data: leads, isLoading, isError, error } = useLeads();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateLeadStatus();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">Leads</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enquiries from tenants interested in your listings
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
          <div>
            <p className="font-medium text-destructive">Could not load leads</p>
            <p className="mt-1 text-muted-foreground">
              {(error as Error)?.message || "Check that the backend exposes GET /leads for agents."}
            </p>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads?.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{lead.tenantName}</span>
                      <span className="text-xs text-muted-foreground">Lead #{lead.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[360px]">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{lead.propertyTitle}</span>
                      {lead.message ? (
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {lead.message}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No message added</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        {lead.tenantEmail}
                      </span>
                      {lead.tenantPhone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          {lead.tenantPhone}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge variant={statusBadgeVariant(lead.status)} className="w-fit capitalize">
                        {lead.status}
                      </Badge>
                      <Select
                        value={lead.status}
                        disabled={isUpdating}
                        onValueChange={(value: LeadStatus) => {
                          if (value !== lead.status) {
                            updateStatus({ id: lead.id, status: value });
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 w-[140px] text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
              {!leads?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No enquiries yet. When tenants request contact on your listings, they will appear here.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
};

export default AgentLeads;
