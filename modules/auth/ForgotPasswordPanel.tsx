"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SITE_NAME } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";
import { buildLoginAndRegisterHrefs } from "@/lib/auth-redirect";
import { AuthHomeLink } from "@/modules/auth/AuthHomeLink";
import { AuthLogo } from "@/modules/auth/AuthLogo";
import { AuthPhoneLabel } from "@/modules/auth/AuthPhoneLabel";
import { OtpField } from "@/modules/auth/OtpField";
import { api } from "@/lib/api";
import { usePathname } from "next/navigation";

const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return trimmed;
};

type Step = "phone" | "otp" | "password";

export default function ForgotPasswordPanel() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loginHref } = buildLoginAndRegisterHrefs(pathname, searchParams);
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;
  const logoUrl = settings?.primaryLogoUrl?.trim() || null;

  const handleRequestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const formattedPhone = normalizePhone(phone);
    if (!formattedPhone) {
      toast({
        title: "Phone number required",
        description: "Enter a valid phone number with country code.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const result = await api.forgotPasswordRequest(formattedPhone);
      setPhone(formattedPhone);
      setOtp("");
      setStep("otp");
      toast({
        title: "Check your phone",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Unable to send code",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.trim().length < 4) {
      toast({
        title: "OTP required",
        description: "Enter the verification code sent to your phone.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const result = await api.forgotPasswordVerify(phone, otp.trim());
      setResetToken(result.resetToken);
      setPassword("");
      setConfirmPassword("");
      setStep("password");
      toast({ title: "Verified", description: "Choose a new password." });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid code.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (password.trim().length < 8 || password.trim().length > 72) {
      toast({
        title: "Invalid password",
        description: "Password must be between 8 and 72 characters.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Confirm password must match your new password.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const result = await api.forgotPasswordReset(resetToken, password.trim());
      toast({ title: "Password updated", description: result.message });
      router.replace(loginHref);
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleEditPhone = () => {
    setStep("phone");
    setOtp("");
    setResetToken("");
  };

  return (
    <div className="w-full max-w-[400px] rounded-3xl border border-border/50 bg-background/60 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mb-8 flex flex-col items-center text-center">
        <AuthLogo logoUrl={logoUrl} siteName={siteName} href="/" className="mb-6" />
        <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight text-foreground">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "phone" && "Enter the phone number on your account."}
          {step === "otp" && `Enter the code sent to ${phone}.`}
          {step === "password" && "Choose a new password for your account."}
        </p>
      </div>

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} className="space-y-6">
          <div className="space-y-2">
            <AuthPhoneLabel />
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                placeholder="+91"
                value={phone}
                inputMode="numeric"
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-xl pl-11"
                disabled={busy}
                required
              />
            </div>
          </div>
          <Button type="submit" className="h-12 w-full rounded-xl" disabled={busy || !phone.trim()}>
            {busy ? "Sending..." : "Send verification code"}
          </Button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="space-y-2">
            <AuthPhoneLabel locked onEdit={handleEditPhone} />
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                placeholder="+91"
                value={phone}
                inputMode="numeric"
                className="h-12 rounded-xl pl-11"
                disabled
                readOnly
              />
            </div>
          </div>
          <OtpField
            value={otp}
            onChange={setOtp}
            disabled={busy}
            active
            hint={`Enter the 6-digit code sent to ${phone}.`}
          />
          <div className="space-y-3">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl"
              disabled={busy || otp.length < 4}
            >
              {busy ? "Verifying..." : "Verify code"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full rounded-xl text-sm text-muted-foreground"
              onClick={() => void handleRequestOtp()}
              disabled={busy}
            >
              Resend code
            </Button>
          </div>
        </form>
      ) : null}

      {step === "password" ? (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium text-foreground">New password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl pl-11"
                disabled={busy}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium text-foreground">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl pl-11"
                disabled={busy}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          <Button type="submit" className="h-12 w-full rounded-xl" disabled={busy}>
            {busy ? "Saving..." : "Update password"}
          </Button>
        </form>
      ) : null}

      <div className="mt-8 text-center text-sm">
        <Link href={loginHref} className="font-semibold text-primary hover:underline">
          Back to login
        </Link>
      </div>
      <AuthHomeLink className="mt-4" />
    </div>
  );
}
