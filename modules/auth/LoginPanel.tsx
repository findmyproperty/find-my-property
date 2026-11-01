"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock, Smartphone, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth, type User } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { SITE_NAME } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";
import { buildLoginAndRegisterHrefs, getPostAuthRoute, parseSafeReturnPath } from "@/lib/auth-redirect";
import { AuthHomeLink } from "@/modules/auth/AuthHomeLink";
import { AuthLogo } from "@/modules/auth/AuthLogo";
import { AuthPhoneLabel } from "@/modules/auth/AuthPhoneLabel";
import { OtpField } from "@/modules/auth/OtpField";

const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return trimmed;
};

const looksLikeEmail = (value: string) => value.trim().includes("@");

/** Normalize password-login identifier: email stays lowercased; phone becomes E.164 when possible. */
const normalizePasswordIdentifier = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (looksLikeEmail(trimmed)) return trimmed.toLowerCase();
  return normalizePhone(trimmed);
};

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
  /** Password tab: email or phone. OTP tab keeps its own phone field. */
  const [passwordId, setPasswordId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const { loginWithPhone, loginWithPassword, requestPhoneOtp } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { registerHref } = buildLoginAndRegisterHrefs(pathname, searchParams);
  const { toast } = useToast();
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;
  const logoUrl = settings?.primaryLogoUrl?.trim() || null;
  const isModal = variant === "modal";

  const finishAuth = (requiresOnboarding: boolean) => {
    if (requiresOnboarding) {
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

  const handlePasswordLogin = async (e?: React.SubmitEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const identifier = normalizePasswordIdentifier(passwordId);
    if (!identifier) {
      toast({
        title: "Email or phone required",
        description: "Enter your email address or phone number with country code.",
        variant: "destructive",
      });
      return;
    }
    if (looksLikeEmail(identifier) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      toast({
        title: "Invalid email",
        description: "Enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    if (password.trim().length < 8) {
      toast({
        title: "Password required",
        description: "Enter your password (at least 8 characters).",
        variant: "destructive",
      });
      return;
    }

    setLoggingIn(true);
    const result = await loginWithPassword(identifier, password.trim());
    setLoggingIn(false);

    if (!result.success) {
      toast({
        title: "Login failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setPasswordId(identifier);
    finishAuth(result.requiresOnboarding);
  };

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

    finishAuth(result.requiresOnboarding);
  };

  const forgotHref = (() => {
    const params = new URLSearchParams();
    const from = searchParams.get("from");
    if (from) params.set("from", from);
    const qs = params.toString();
    return qs ? `/forgot-password?${qs}` : "/forgot-password";
  })();

  const handleEditPhone = () => {
    setOtpSent(false);
    setOtp("");
  };

  const form = (
    <>
      {!isModal ? (
        <div className="mb-8 flex flex-col items-center text-center">
          <AuthLogo logoUrl={logoUrl} siteName={siteName} href="/" className="mb-6" />
          <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Log in with email or phone and password, or use a one-time code.
          </p>
        </div>
      ) : (
        <p className="mb-5 text-sm text-muted-foreground">
          Log in to request a callback. We&apos;ll bring you right back to this form.
        </p>
      )}

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="mb-5 grid w-full grid-cols-2">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="otp">OTP</TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="space-y-6">
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="ml-1 text-sm font-medium leading-none text-foreground">
                Email or phone
              </label>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  placeholder="email@example.com or +91…"
                  value={passwordId}
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  onChange={(e) => setPasswordId(e.target.value)}
                  className="h-12 w-full rounded-xl border-input bg-background pl-11 text-base shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={loggingIn}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-sm font-medium leading-none text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border-input bg-background pl-11 text-base shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={loggingIn}
                  autoComplete="current-password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href={forgotHref}
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all active:scale-[0.98]"
              disabled={loggingIn || !passwordId.trim() || password.trim().length < 8}
            >
              {loggingIn ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="otp" className="space-y-6">
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <AuthPhoneLabel locked={otpSent} onEdit={handleEditPhone} />
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  placeholder="+91"
                  value={phone}
                  inputMode="numeric"
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 w-full rounded-xl border-input bg-background pl-11 text-base shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={otpSent || sendingOtp}
                  required
                />
              </div>
            </div>

            {otpSent ? (
              <OtpField
                value={otp}
                onChange={setOtp}
                disabled={verifyingOtp}
                active={otpSent}
                hint={`Enter the 6-digit code sent to ${phone}.`}
              />
            ) : null}

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
        </TabsContent>
      </Tabs>

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

      {!isModal ? <AuthHomeLink className="mt-5" /> : null}
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
