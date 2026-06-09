"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Store } from "lucide-react";
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
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getPostAuthRoute, parseSafeReturnPath } from "@/lib/auth-redirect";
import type { VendorCategory } from "@/schema/vendor";

const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return trimmed;
};

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: "real_estate", label: "Real estate agent" },
  { value: "home_services", label: "Home services" },
  { value: "packers", label: "Packers & movers" },
  { value: "lawyer", label: "Lawyer" },
  { value: "ca", label: "CA" },
  { value: "web_designer", label: "Web designer" },
  { value: "trainer", label: "Trainer" },
  { value: "tutor", label: "Tutor" },
  { value: "other", label: "Other" },
];

export default function RegisterVendorPanel() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("other");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { loginWithPhone, requestPhoneOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSendOtp = async () => {
    if (!name.trim() || !businessName.trim()) {
      toast({ title: "Name and business name required", variant: "destructive" });
      return;
    }
    const formattedPhone = normalizePhone(phone);
    if (!formattedPhone) {
      toast({ title: "Valid phone required", variant: "destructive" });
      return;
    }
    setSendingOtp(true);
    const result = await requestPhoneOtp(formattedPhone);
    setSendingOtp(false);
    if (!result.success) {
      toast({ title: "OTP failed", description: result.error, variant: "destructive" });
      return;
    }
    setOtpSent(true);
    toast({ title: "OTP sent" });
  };

  const handleVerify = async () => {
    const formattedPhone = normalizePhone(phone);
    setVerifying(true);
    const result = await loginWithPhone(formattedPhone, otp.trim(), name.trim(), "vendor");
    setVerifying(false);
    if (!result.success) {
      toast({ title: "Verification failed", description: result.error, variant: "destructive" });
      return;
    }
    try {
      await api.vendors.updateProfile({ businessName: businessName.trim(), category });
    } catch {
      /* may run after onboarding if token not ready */
    }
    const from = parseSafeReturnPath(searchParams.get("from") ?? "");
    if (result.requiresOnboarding) {
      router.replace("/onboarding");
      return;
    }
    router.replace(from ?? "/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Register as FMP Partner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join as a verified service vendor
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Business name</Label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
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
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
          </div>
          {otpSent && (
            <div className="space-y-2">
              <Label>OTP</Label>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
          )}
        </div>

        {!otpSent ? (
          <Button className="w-full" onClick={handleSendOtp} disabled={sendingOtp}>
            {sendingOtp ? "Sending…" : "Send OTP"}
          </Button>
        ) : (
          <Button className="w-full" onClick={handleVerify} disabled={verifying}>
            {verifying ? "Verifying…" : "Create partner account"}
          </Button>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
          {" · "}
          <Link href="/register" className="text-primary underline">
            Tenant register
          </Link>
        </p>
      </div>
    </div>
  );
}
