"use client";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth, type User } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { SITE_NAME } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";
import { buildLoginAndRegisterHrefs, getPostAuthRoute, parseSafeReturnPath } from "@/lib/auth-redirect";
import { AuthLogo } from "@/modules/auth/AuthLogo";

const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return trimmed;
};

const OTP_SLOT_CLASS =
  "h-12 flex-1 min-w-0 max-w-12 rounded-xl border border-input shadow-sm first:rounded-xl last:rounded-xl first:border-l";

type LoginPanelProps = {
  /** Compact layout for service-page auth modal. */
  variant?: "page" | "modal";
  onAuthSuccess?: () => void;
  onSwitchToRegister?: () => void;
};

export default function LoginPanel({
  variant = "page",
  onAuthSuccess,
  onSwitchToRegister,
}: LoginPanelProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const otpInputRef = useRef<React.ElementRef<typeof InputOTP>>(null);
  const { loginWithPhone, requestPhoneOtp } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { registerHref } = buildLoginAndRegisterHrefs(pathname, searchParams);
  const { toast } = useToast();
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;
  const logoUrl = settings?.primaryLogoUrl?.trim() || null;
  const isModal = variant === "modal";

  useEffect(() => {
    if (!otpSent) return;
    const timer = window.setTimeout(() => {
      otpInputRef.current?.focus();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [otpSent]);

  const handleSendOtp = async (e?: React.SubmitEvent<HTMLFormElement>) => {
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

    setSendingOtp(true);
    const result = await requestPhoneOtp(formattedPhone);
    setSendingOtp(false);

    if (!result.success) {
      toast({
        title: "Unable to send OTP",
        description: "error" in result ? result.error : "Unable to send OTP",
        variant: "destructive",
      });
      return;
    }

    setPhone(formattedPhone);
    setOtp("");
    setOtpSent(true);
    toast({
      title: "OTP sent",
      description: `Verification code sent to ${formattedPhone}`,
    });
  };

  const handleVerifyOtp = async (e?: React.SubmitEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!otpSent) {
      toast({
        title: "OTP not sent",
        description: "Request OTP first.",
        variant: "destructive",
      });
      return;
    }

    setVerifyingOtp(true);
    const result = await loginWithPhone(phone, otp);
    setVerifyingOtp(false);

    if (!result.success) {
      toast({
        title: "Phone login failed",
        description: "error" in result ? result.error : "Login failed",
        variant: "destructive",
      });
      return;
    }

    if (result.requiresOnboarding) {
      router.replace("/onboarding");
      return;
    }

    if (isModal) {
      toast({ title: "Signed in", description: "Returning to your request…" });
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
          <AuthLogo logoUrl={logoUrl} siteName={siteName} className="mb-6" />
          <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your phone number to login or securely create a new account.
          </p>
        </div>
      ) : (
        <p className="mb-5 text-sm text-muted-foreground">
          Log in with your phone to request a callback. We&apos;ll bring you right back to this form.
        </p>
      )}

      <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
        <div className="space-y-4">
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
            <div className="space-y-2">
              <label className="ml-1 text-sm font-medium leading-none text-foreground">
                One-Time Password
              </label>
              <InputOTP
                ref={otpInputRef}
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={verifyingOtp}
                containerClassName="w-full"
                autoFocus
              >
                <InputOTPGroup className="w-full gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} className={OTP_SLOT_CLASS} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to {phone}.
              </p>
            </div>
          ) : null}
        </div>

        {!otpSent ? (
          <Button
            type="button"
            className="h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all active:scale-[0.98]"
            onClick={() => void handleSendOtp()}
            disabled={sendingOtp || !phone.trim()}
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
              {verifyingOtp ? "Verifying..." : "Verify & Login"}
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

      <div className={`text-center text-sm ${isModal ? "mt-6" : "mt-8"}`}>
        <span className="text-muted-foreground">New to {siteName}? </span>
        {onSwitchToRegister ? (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-primary transition-all hover:underline"
          >
            Create an account
          </button>
        ) : (
          <Link href={registerHref} className="font-semibold text-primary transition-all hover:underline">
            Create an account
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
