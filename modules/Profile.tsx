"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget, type CloudinaryUploadWidgetInfo } from "next-cloudinary";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Shield,
  Trash2,
  UserCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/contexts/auth-context";
import { normalizePhone } from "@/helpers";
import { useToast } from "@/hooks/use-toast";
import VendorProfileSection from "@/modules/vendor/VendorProfileSection";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
}

function roleLabel(role: string) {
  return role.replace(/_/g, " ");
}

const Profile = () => {
  const { user, updateProfile, requestPhoneOtp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(() => user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!user) return null;

  const displayName = user.name || "Your profile";
  const displayPhone = (user.phone ?? "").trim();
  const avatarUrl = user.avatarUrl ?? null;
  const initials = getInitials(displayName);
  const hasNameChanges = name.trim() !== (user.name ?? "").trim();

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

    setName(trimmed);
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
      description: nextUrl
        ? "Your new profile picture is live."
        : "Your profile picture has been cleared.",
    });
    return true;
  };

  const handleCloudinarySuccess = async (
    info: CloudinaryUploadWidgetInfo | undefined,
  ) => {
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
    if (!avatarUrl) return;
    setIsUploadingAvatar(true);
    try {
      await persistAvatar(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const openAvatarWidget = (open: () => void) => {
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
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">My Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your account information current and verified.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
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
              {({ open }) => (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="size-28 ring-2 ring-border">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      size="icon"
                      className="absolute -bottom-1 -right-1 size-9 rounded-full"
                      onClick={() => openAvatarWidget(open)}
                      disabled={isUploadingAvatar}
                      aria-label={avatarUrl ? "Change profile photo" : "Upload profile photo"}
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-lg font-semibold text-foreground">
                      {displayName}
                    </h3>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    <div className="mt-2 flex justify-center">
                      <Badge variant="secondary" className="capitalize">
                        {roleLabel(user.role)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openAvatarWidget(open)}
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
                </div>
              )}
            </CldUploadWidget>

            <Separator />

            <div className="grid w-full gap-3 text-left">
              <ProfileFact icon={Mail} label="Email" value={user.email ?? "-"} />
              <ProfileFact icon={Phone} label="Phone" value={displayPhone || "Not verified"} />
              <ProfileFact icon={Shield} label="Role" value={roleLabel(user.role)} />
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Identity</CardTitle>
              <CardDescription>
                This name appears across your dashboard and profile surfaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="profile-name" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Full name
                </Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profile-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input id="profile-email" value={user.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed from this page.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {hasNameChanges ? (
                  <>
                    <Pencil className="h-3.5 w-3.5" />
                    Unsaved name change
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Identity is up to date
                  </>
                )}
              </div>
              <Button type="submit" disabled={isSaving || !hasNameChanges}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Saving...
                  </>
                ) : (
                  "Save identity"
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Contact Verification</CardTitle>
              <CardDescription>
                Your phone number is updated only after OTP verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <p className="font-medium text-foreground">
                      {displayPhone || "No phone number added"}
                    </p>
                    {displayPhone ? (
                      <Badge variant="outline" className="gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Change this when your contact number changes.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={openPhoneDialog}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {displayPhone ? "Change phone" : "Add phone"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {user.defaultRole === "admin" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <Shield className="h-4 w-4 text-primary" />
                  Admin Role Override
                </CardTitle>
                <CardDescription>
                  Switch your current session role for testing role-specific dashboards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={user.role}
                  onValueChange={async (val: UserRole) => {
                    const res = await updateProfile({ role: val });
                    if (res.success) {
                      toast({
                        title: "Role updated",
                        description: `You are now a ${val}. Redirecting...`,
                      });
                      router.push("/");
                      router.refresh();
                    } else {
                      toast({
                        title: "Failed",
                        description: res.error || "Unknown error",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ) : null}
        </form>
      </div>

      {user.role === "vendor" ? <VendorProfileSection /> : null}

      <Dialog open={phoneDialogOpen} onOpenChange={handlePhoneDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update phone number</DialogTitle>
            <DialogDescription>
              We&apos;ll send a one-time code before saving this number.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="phone-change-input">Phone number</Label>
              <Input
                id="phone-change-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneDraft}
                onChange={(e) => setPhoneDraft(e.target.value)}
                disabled={otpSent || sendingOtp}
              />
              <p className="text-xs text-muted-foreground">
                Include the country code so OTP delivery works reliably.
              </p>
            </div>

            {otpSent ? (
              <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <div>
                  <Label>Verification code</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter the code sent to {phoneDraft}.
                  </p>
                </div>
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
            ) : null}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {!otpSent ? (
              <Button
                type="button"
                className="w-full"
                onClick={handleSendPhoneOtp}
                disabled={sendingOtp || !phoneDraft.trim()}
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send verification code"
                )}
              </Button>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleVerifyAndUpdatePhone}
                  disabled={verifyingOtp || otp.length < 4}
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify and update"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSendPhoneOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending..." : "Resend code"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ProfileFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default Profile;
