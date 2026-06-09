"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Mail, Phone, Shield, Pencil, Loader2, Camera, Trash2 } from "lucide-react";
import type { UserRole } from "@/contexts/auth-context";
import { normalizePhone } from "@/helpers";
import { CldUploadWidget, type CloudinaryUploadWidgetInfo } from "next-cloudinary";
import { useRouter } from "next/navigation";
import VendorProfileSection from "@/modules/vendor/VendorProfileSection";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const Profile = () => {
  const { user, updateProfile, requestPhoneOtp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const displayPhone = (user?.phone ?? "").trim();

  const resetPhoneDialog = () => {
    setOtpSent(false);
    setOtp("");
    setSendingOtp(false);
    setVerifyingOtp(false);
  };

  const openPhoneDialog = () => {
    setPhoneDraft(displayPhone);
    resetPhoneDialog();
    setPhoneDialogOpen(true);
  };

  const handlePhoneDialogOpenChange = (open: boolean) => {
    setPhoneDialogOpen(open);
    if (!open) resetPhoneDialog();
  };

  const handleSendPhoneOtp = async () => {
    const formatted = normalizePhone(phoneDraft);
    if (!formatted) {
      toast({
        title: "Phone number required",
        description: "Enter a valid phone number with country code.",
        variant: "destructive",
      });
      return;
    }

    setSendingOtp(true);
    const result = await requestPhoneOtp(formatted);
    setSendingOtp(false);

    if (!result.success) {
      toast({
        title: "Unable to send OTP",
        description: "error" in result ? result.error : "Try again later.",
        variant: "destructive",
      });
      return;
    }

    setPhoneDraft(formatted);
    setOtpSent(true);
    setOtp("");
    toast({
      title: "OTP sent",
      description: `Verification code sent to ${formatted}`,
    });
  };

  const handleVerifyAndUpdatePhone = async () => {
    const formatted = normalizePhone(phoneDraft);
    if (!formatted || otp.length < 4) {
      toast({
        title: "Enter the code",
        description: "Fill in the verification code from SMS.",
        variant: "destructive",
      });
      return;
    }

    setVerifyingOtp(true);
    const res = await updateProfile({ phone: formatted, otp: otp.trim() });
    setVerifyingOtp(false);

    if (!res.success) {
      toast({
        title: "Verification failed",
        description: res.error || "Check the code and try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Phone updated",
      description: "Your phone number has been verified and saved.",
    });
    setPhoneDialogOpen(false);
    resetPhoneDialog();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const res = await updateProfile({ name: trimmed });
    setIsSaving(false);

    if (!res.success) {
      toast({
        title: "Couldn't save profile",
        description: res.error || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile updated",
      description: "Your changes have been saved.",
    });
  };

  const persistAvatar = async (nextUrl: string | null) => {
    const res = await updateProfile({ avatarUrl: nextUrl });
    if (!res.success) {
      toast({
        title: "Couldn't save photo",
        description: res.error || "Please try again.",
        variant: "destructive",
      });
      return false;
    }
    toast({
      title: nextUrl ? "Photo updated" : "Photo removed",
      description: nextUrl ? "Your new profile picture is live." : "Your profile picture has been cleared.",
    });
    return true;
  };

  const handleCloudinarySuccess = async (info: CloudinaryUploadWidgetInfo | undefined) => {
    const url = info?.secure_url;
    if (!url) return;
    setIsUploadingAvatar(true);
    try {
      await persistAvatar(url);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatarUrl) return;
    setIsUploadingAvatar(true);
    try {
      await persistAvatar(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U";
  const avatarUrl = user.avatarUrl ?? null;

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">My Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your account details</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <div className="flex flex-col items-center gap-4 pb-6 border-b border-border text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
            <CldUploadWidget
              uploadPreset={cloudinaryPreset}
              options={{
                multiple: false,
                cropping: true,
                croppingAspectRatio: 1,
                showSkipCropButton: false,
                clientAllowedFormats: ["image"],
                maxFileSize: AVATAR_MAX_BYTES,
                sources: ["local", "camera", "url"],
                folder: "avatars",
              }}
              onSuccess={(result) => {
                if (result.event !== "success") return;
                const info = result.info;
                if (info && typeof info !== "string") {
                  void handleCloudinarySuccess(info as CloudinaryUploadWidgetInfo);
                }
              }}
              onError={(error) => {
                toast({
                  title: "Upload failed",
                  description: typeof error === "string" ? error : "Please try again.",
                  variant: "destructive",
                });
                setIsUploadingAvatar(false);
              }}
            >
              {({ open }) => {
                const openWidget = () => {
                  if (!cloudinaryPreset) {
                    toast({
                      title: "Uploads unavailable",
                      description: "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
                      variant: "destructive",
                    });
                    return;
                  }
                  open();
                };

                return (
                  <>
                    <div className="relative">
                      <Avatar className="h-24 w-24 shrink-0 ring-2 ring-border">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={user.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <button
                        type="button"
                        onClick={openWidget}
                        disabled={isUploadingAvatar}
                        aria-label={avatarUrl ? "Change profile photo" : "Upload profile photo"}
                        className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-semibold text-foreground truncate">{user.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">
                        {user.role}
                      </span>
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={openWidget}
                          disabled={isUploadingAvatar}
                        >
                          <Camera className="mr-2 h-3.5 w-3.5" />
                          {avatarUrl ? "Change photo" : "Upload photo"}
                        </Button>
                        {avatarUrl ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => void handleRemoveAvatar()}
                            disabled={isUploadingAvatar}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Remove
                          </Button>
                        ) : null}
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        JPG, PNG or WebP up to 5 MB. Stored on Cloudinary.
                      </p>
                    </div>
                  </>
                );
              }}
            </CldUploadWidget>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-name" className="flex items-center gap-2 text-foreground">
                <UserCircle className="w-4 h-4" /> Full Name
              </Label>
              <Input
                id="tenant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-email" className="flex items-center gap-2 text-foreground">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input
                id="tenant-email"
                value={user.email ?? ""}
                disabled
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>

            {user.defaultRole === "admin" && (
              <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <Label className="flex items-center gap-2 text-primary font-semibold">
                  <Shield className="w-4 h-4" /> Super Admin Role Override
                </Label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={user.role}
                  onChange={async (e) => {
                    const val = e.target.value as UserRole;
                    const res = await updateProfile({ role: val });
                    if (res.success) {
                      toast({ title: "Role updated", description: `You are now a ${val}. logging out...` });
                      router.push("/");
                      router.refresh();
                    } else {
                      toast({ title: "Failed", description: res.error || "Unknown error", variant: "destructive" });
                    }
                  }}
                >
                  <option value="tenant">Tenant</option>
                  <option value="agent">Agent</option>
                  <option value="vendor">Vendor</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-muted-foreground">Instantly switches your role context on the backend and updates your session.</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="tenant-phone" className="flex items-center gap-2 text-foreground mb-0">
                  <Phone className="w-4 h-4" /> Phone
                </Label>
                <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={openPhoneDialog} aria-label="Change phone number">
                  <Pencil className="size-4" />
                </Button>
              </div>
              <Input
                id="tenant-phone"
                type="tel"
                value={displayPhone}
                placeholder="No phone number yet"
                disabled
                readOnly
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Use the edit button to verify a new number with OTP.</p>
            </div>
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>

      {user?.role === "vendor" ? <VendorProfileSection /> : null}

      <Dialog open={phoneDialogOpen} onOpenChange={handlePhoneDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update phone number</DialogTitle>
            <DialogDescription>
              We&apos;ll send a one-time code to verify your number before saving it to your account.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="phone-change-input">Phone</Label>
              <Input
                id="phone-change-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneDraft}
                onChange={(e) => setPhoneDraft(e.target.value)}
                disabled={otpSent || sendingOtp}
                className="bg-background"
              />
            </div>

            {otpSent && (
              <div className="space-y-2">
                <Label>Verification code</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={verifyingOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {!otpSent ? (
              <Button type="button" className="w-full" onClick={handleSendPhoneOtp} disabled={sendingOtp || !phoneDraft.trim()}>
                {sendingOtp ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Sending…
                  </>
                ) : (
                  "Send verification code"
                )}
              </Button>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleVerifyAndUpdatePhone}
                  disabled={verifyingOtp || otp.length < 4}
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Verifying…
                    </>
                  ) : (
                    "Verify and update"
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={handleSendPhoneOtp} disabled={sendingOtp}>
                  {sendingOtp ? "Sending…" : "Resend code"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
