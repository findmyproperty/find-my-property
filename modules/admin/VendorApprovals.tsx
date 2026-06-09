"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminVendors, useAdminUpdateVendor } from "@/hooks/use-vendor-leads";
import { useToast } from "@/hooks/use-toast";

export default function VendorApprovals() {
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const query =
    filter === "all" ? {} : { verificationStatus: filter as "pending" | "verified" | "rejected" };
  const { data, isLoading } = useAdminVendors(query);
  const { mutate: updateVendor, isPending } = useAdminUpdateVendor();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Vendor partners</h2>
          <p className="text-sm text-muted-foreground">Approve KYC and manage partner access</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      <div className="space-y-3">
        {data?.items.map((v) => (
          <div
            key={v.userId}
            className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">
                  {v.businessName || v.user?.name || `Vendor #${v.userId}`}
                </h3>
                <Badge variant={v.verificationStatus === "verified" ? "default" : "secondary"}>
                  {v.verificationStatus}
                </Badge>
                {v.user?.isActive === false && <Badge variant="destructive">Blocked</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {v.category.replace("_", " ")} · {v.user?.phone ?? "—"}
              </p>
              {v.rejectionReason && (
                <p className="text-xs text-destructive mt-1">{v.rejectionReason}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {v.verificationStatus !== "verified" && (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    updateVendor(
                      { userId: v.userId, input: { verificationStatus: "verified" } },
                      { onSuccess: () => toast({ title: "Vendor verified" }) },
                    )
                  }
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              )}
              {v.verificationStatus !== "rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    updateVendor(
                      {
                        userId: v.userId,
                        input: {
                          verificationStatus: "rejected",
                          rejectionReason: "Did not meet verification requirements",
                        },
                      },
                      { onSuccess: () => toast({ title: "Vendor rejected" }) },
                    )
                  }
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  updateVendor(
                    { userId: v.userId, input: { isActive: false } },
                    { onSuccess: () => toast({ title: "Vendor blocked" }) },
                  )
                }
              >
                <Ban className="w-4 h-4 mr-1" />
                Block
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && data?.items.length === 0 && (
          <p className="text-center text-muted-foreground py-12 text-sm">No vendors in this filter</p>
        )}
      </div>
    </div>
  );
}
