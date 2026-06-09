"use client";

import { format } from "date-fns";
import { Loader2, Wallet } from "lucide-react";
import { useVendorWalletSummary, useVendorWalletEntries } from "@/hooks/use-vendor-wallet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function VendorWallet() {
  const { data: summary, isLoading: summaryLoading } = useVendorWalletSummary();
  const { data: entries, isLoading: entriesLoading } = useVendorWalletEntries(1);

  if (summaryLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: "Total earnings", value: summary?.totalEarnings ?? 0 },
    { label: "Pending settlement", value: summary?.pendingSettlement ?? 0 },
    { label: "Paid out", value: summary?.paidOut ?? 0 },
    { label: "Commission deducted", value: summary?.commissionDeducted ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Wallet
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Earnings and settlements (internal ledger)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold mt-1">₹{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <h3 className="font-semibold p-4 border-b border-border">Ledger</h3>
        {entriesLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries?.items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">
                    {format(new Date(e.createdAt), "PP")}
                  </TableCell>
                  <TableCell className="capitalize">{e.type}</TableCell>
                  <TableCell>₹{e.amount}</TableCell>
                  <TableCell>{e.status}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {e.description}
                  </TableCell>
                </TableRow>
              ))}
              {entries?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No entries yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
