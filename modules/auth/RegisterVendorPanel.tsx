"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { parseSafeReturnPath } from "@/lib/auth-redirect";
import { SITE_NAME } from "@/lib/branding";
import { useSettings } from "@/contexts/settings-context";
import { AuthLogo } from "@/modules/auth/AuthLogo";
import { useCategories } from "@/hooks/use-categories";

const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return trimmed;
};

export default function RegisterVendorPanel() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { loginWithPhone, requestPhoneOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { settings } = useSettings();
  const siteName = settings?.siteName?.trim() || SITE_NAME;
  const logoUrl = settings?.primaryLogoUrl?.trim() || null;

  const { data: allCategories = [] } = useCategories();
  const categoryOptions = useMemo(
    () =>
      allCategories
        .filter((c) => c.isActive !== false)
        .map((c) => ({ value: c.id.toString(), label: c.name, id: c.id })),
    [allCategories],
  );

  const addCategory = (id: number) => {
    if (!selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds((prev) => [...prev, id]);
    }
  };

  const removeCategory = (id: number) => {
    setSelectedCategoryIds((prev) => prev.filter((v) => v !== id));
  };

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
      await api.vendors.updateProfile({
        businessName: businessName.trim(),
        categoryIds: selectedCategoryIds,
      });
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel for desktop */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        {/* Background decorative shapes */}
        <div className="absolute -right-20 -top-20 size-80 rounded-full border border-primary-foreground/10 pointer-events-none" />
        <div className="absolute -bottom-28 right-24 size-96 rounded-full border border-primary-foreground/5 pointer-events-none" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 font-heading text-lg font-bold hover:opacity-90">
            {siteName}
          </Link>
        </div>

        <div className="relative max-w-xl space-y-6">
          <Badge className="bg-primary-foreground/10 hover:bg-primary-foreground/10 text-primary-foreground border-none px-3.5 py-1 text-xs">
            Looking for the best service?
          </Badge>
          <h2 className="font-heading text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            &ldquo;Business owners don&apos;t need more advertisements.<br />
            They need <span className="underline decoration-wavy decoration-2 decoration-amber-400">more revenue</span>.&rdquo;
          </h2>
          <p className="text-lg leading-relaxed text-primary-foreground/85">
            {siteName} is built to help verified businesses grow through trusted opportunities,
            transparent systems, and long-term partnerships.
          </p>
        </div>

        <div className="relative text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>

      {/* Registration Form container */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 shadow-sm space-y-6">
          <div className="text-center">
            <AuthLogo logoUrl={logoUrl} siteName={siteName} className="mx-auto mb-4" />
            <h1 className="text-xl font-bold">Register as {siteName} Partner</h1>
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
              <Label>Categories</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex flex-wrap gap-1 items-center cursor-pointer hover:bg-accent"
                  >
                    {selectedCategoryIds.length === 0 ? (
                      <span className="text-muted-foreground">Select categories...</span>
                    ) : (
                      selectedCategoryIds.map((id) => {
                        const cat = categoryOptions.find((o) => parseInt(o.value) === id);
                        const label = cat ? cat.label : `ID ${id}`;
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCategory(id);
                            }}
                          >
                            {label}
                            <X className="size-3" />
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandList>
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        {categoryOptions.map((opt) => {
                          const idNum = parseInt(opt.value);
                          const isSelected = selectedCategoryIds.includes(idNum);
                          return (
                            <CommandItem
                              key={opt.value}
                              value={`${opt.label} ${opt.value}`}
                              keywords={[opt.label, opt.value]}
                              onSelect={() => {
                                if (isSelected) {
                                  removeCategory(idNum);
                                } else {
                                  addCategory(idNum);
                                }
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {opt.label}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
    </div>
  );
}
