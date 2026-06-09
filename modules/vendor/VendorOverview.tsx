"use client";

import { motion } from "framer-motion";
import { Users, Wallet, CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { useVendorLeads } from "@/hooks/use-vendor-leads";
import { useVendorWalletSummary } from "@/hooks/use-vendor-wallet";
import { useVendorProfile } from "@/hooks/use-vendor-profile";
import { Badge } from "@/components/ui/badge";

export default function VendorOverview() {
  const { data: leads } = useVendorLeads();
  const { data: wallet } = useVendorWalletSummary();
  const { data: profile } = useVendorProfile();

  const newLeads = leads?.filter((l) => l.status === "new").length ?? 0;
  const completed = leads?.filter((l) => l.status === "completed").length ?? 0;

  const stats = [
    { label: "New leads", value: String(newLeads), icon: Users },
    { label: "Completed jobs", value: String(completed), icon: CheckCircle },
    {
      label: "Pending payout",
      value: wallet ? `₹${wallet.pendingSettlement}` : "—",
      icon: Wallet,
    },
    {
      label: "Verification",
      value: profile?.verificationStatus ?? "—",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      {profile?.verificationStatus === "pending" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          Your partner profile is awaiting admin verification. You can update KYC in{" "}
          <Link href="/profile" className="text-primary underline">
            Profile
          </Link>
          .
        </div>
      )}
      {profile?.verificationStatus === "rejected" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          Application rejected
          {profile.rejectionReason ? `: ${profile.rejectionReason}` : "."}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-5 border border-border"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground capitalize">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-5 flex flex-wrap gap-3">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15"
        >
          <Users className="w-4 h-4" />
          View leads
        </Link>
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15"
        >
          <Wallet className="w-4 h-4" />
          Wallet
        </Link>
        {profile?.verificationStatus === "verified" && (
          <Badge variant="secondary">Verified partner</Badge>
        )}
      </div>
    </div>
  );
}
