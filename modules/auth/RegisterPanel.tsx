"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Smartphone, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useAuth, type User } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { buildLoginAndRegisterHrefs, getPostAuthRoute, parseSafeReturnPath } from "@/lib/auth-redirect";
import { SITE_NAME } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";

const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return trimmed;
};

type RegisterPanelProps = {
  variant?: "page" | "modal";
  onAuthSuccess?: () => void;
  onSwitchToLogin?: () => void;
};

export default function RegisterPanel({
  variant = "page",
  onAuthSuccess,
  onSwitchToLogin,
}: RegisterPanelProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const { loginWithPhone, requestPhoneOtp } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loginHref } = buildLoginAndRegisterHrefs(pathname, searchParams);
  const { toast } = useToast();
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;
  const isModal = variant === "modal";

  const handleSendOtp = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = normalizePhone(phone);
    if (!formattedPhone) {
      toast({
        title: "Phone number required",
        description: "Enter a valid phone number with country code.",
        variant: "destructive",
      });
      return;
    }

    setSendingOtp(true);
    const result = await requestPhoneOtp(formattedPhone);
    setSendingOtp(false);

    if (!result.success) {
      toast({
        title: "Unable to send OTP",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setPhone(formattedPhone);
    setOtpSent(true);
    toast({ title: "OTP sent", description: `Verification code sent to ${formattedPhone}` });
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      toast({ title: "OTP not sent", description: "Request OTP first.", variant: "destructive" });
      return;
    }

    setVerifyingOtp(true);
    const result = await loginWithPhone(phone, otp, name);
    setVerifyingOtp(false);

    if (!result.success) {
      toast({ title: "Signup failed", description: result.error, variant: "destructive" });
      return;
    }

    if (result.requiresOnboarding) {
      router.replace("/onboarding");
      return;
    }

    if (isModal) {
      toast({ title: "Account created", description: "Returning to your request…" });
      onAuthSuccess?.();
      return;
    }

    const nextUser = JSON.parse(localStorage.getItem("nb_user") || "null") as User | null;
    const from = new URLSearchParams(window.location.search).get("from");
    const safeFrom = parseSafeReturnPath(from);
    router.replace(safeFrom || getPostAuthRoute(nextUser));
  };

  const form = (
    <>
      {!isModal ? (
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-tr from-primary to-primary-foreground/90 shadow-lg shadow-primary/20">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground">Sign up securely with your phone number to get started.</p>
        </div>
      ) : (
        <p className="mb-5 text-sm text-muted-foreground">
          Create an account to request a callback. You&apos;ll return here after sign-up.
        </p>
      )}

      <form onSubmit={handlePhoneSignup} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium leading-none text-foreground">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full rounded-xl border-input bg-background pl-11 text-base shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary"
                disabled={otpSent || sendingOtp}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium leading-none text-foreground">Phone Number</label>
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                placeholder="+91"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 w-full rounded-xl border-input bg-background pl-11 text-base shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary"
                disabled={otpSent || sendingOtp}
                required
              />
            </div>
          </div>

          {otpSent ? (
            <div className="space-y-2 overflow-hidden">
              <label className="ml-1 text-sm font-medium leading-none text-foreground">One-Time Password</label>
              <Input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-12 w-full rounded-xl border-input bg-background text-center text-lg font-medium tracking-[0.5em] shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary"
                maxLength={10}
                required
              />
            </div>
          ) : null}
        </div>

        {!otpSent ? (
          <Button
            type="button"
            className="h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all active:scale-[0.98]"
            onClick={() => void handleSendOtp()}
            disabled={sendingOtp || !phone.trim() || !name.trim()}
          >
            {sendingOtp ? "Sending OTP..." : "Continue with Phone"}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all active:scale-[0.98]"
              disabled={verifyingOtp || otp.length < 4}
            >
              {verifyingOtp ? "Verifying..." : "Verify & Sign Up"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-xl text-sm text-muted-foreground hover:bg-muted/50"
              onClick={() => void handleSendOtp()}
              disabled={sendingOtp}
            >
              {sendingOtp ? "Sending..." : "Didn't receive code? Resend"}
            </Button>
          </div>
        )}
      </form>

      <div className={`text-center text-sm ${isModal ? "mt-4" : "mt-6"}`}>
        <Link href="/register-vendor" className="text-primary font-medium hover:underline">
          Register as FMP partner (vendor)
        </Link>
      </div>

      <div className={`text-center text-sm ${isModal ? "mt-6" : "mt-8"}`}>
        <span className="text-muted-foreground">Already have an account? </span>
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-primary transition-all hover:underline"
          >
            Log in instead
          </button>
        ) : (
          <Link href={loginHref} className="font-semibold text-primary transition-all hover:underline">
            Log in instead
          </Link>
        )}
      </div>
    </>
  );

  if (isModal) {
    return form;
  }

  return (
    <div className="w-full max-w-[400px] rounded-3xl border border-border/50 bg-background/60 p-8 shadow-2xl backdrop-blur-xl">
      {form}
    </div>
  );
}
