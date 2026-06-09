"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { useAdminVendorSelect } from "@/hooks/use-vendor-leads";
import {
  useAdminVendorWalletSummary,
  useAdminVendorPayout,
} from "@/hooks/use-vendor-wallet";
import { useToast } from "@/hooks/use-toast";

export default function VendorPaymentsAdmin() {
  const { data: vendors } = useAdminVendorSelect();
  const [vendorUserId, setVendorUserId] = useState<number | null>(null);
  const { data: summary, isLoading } = useAdminVendorWalletSummary(vendorUserId);
  const { mutate: payout, isPending } = useAdminVendorPayout();
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="font-heading text-xl font-bold">Vendor payments</h2>
        <p className="text-sm text-muted-foreground">
          Record payouts against the internal ledger
        </p>
      </div>

      <div className="space-y-2">
        <Label>Vendor</Label>
        <Select
          value={vendorUserId != null ? String(vendorUserId) : ""}
          onValueChange={(v) => setVendorUserId(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select verified vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors?.map((v) => (
              <SelectItem key={v.userId} value={String(v.userId)}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {vendorUserId != null && (
        <>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : summary ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Pending</p>
                <p className="text-lg font-bold">₹{summary.pendingSettlement}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Paid out</p>
                <p className="text-lg font-bold">₹{summary.paidOut}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2 border rounded-xl p-4">
            <Label>Record payout (₹)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              disabled={isPending || !amount}
              onClick={() => {
                const n = Number(amount);
                if (!Number.isFinite(n) || n <= 0) return;
                payout(
                  { vendorUserId, amount: n, description: "Admin payout" },
                  {
                    onSuccess: () => {
                      setAmount("");
                      toast({ title: "Payout recorded" });
                    },
                  },
                );
              }}
            >
              {isPending ? "Saving…" : "Record payout"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
