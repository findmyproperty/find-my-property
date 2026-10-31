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
  FileText,
  Store,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/contexts/auth-context";
import { normalizePhone } from "@/helpers";
import { useToast } from "@/hooks/use-toast";
import { useVendorProfile } from "@/hooks/use-vendor-profile";
import {
  VendorBusinessForm,
  VendorKycForm,
  VendorProfileStatusBanner,
} from "@/modules/vendor/VendorProfileSection";

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
  const {
    user,
    updateProfile,
    requestPhoneOtp,
    requestEmailOtp,
    verifyEmailOtp,
    changePassword,
  } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isVendor = user?.role === "vendor";
  const { data: vendorProfile } = useVendorProfile();
  const [profileTab, setProfileTab] = useState("account");
  const [name, setName] = useState(() => user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!user) return null;

  const displayName = user.name || "Your profile";
  const displayPhone = (user.phone ?? "").trim();
  const draftPhoneNormalized = normalizePhone(phoneDraft);
  const currentPhoneNormalized = normalizePhone(displayPhone);
  const isSamePhoneAsCurrent =
    !!draftPhoneNormalized &&
    !!currentPhoneNormalized &&
    draftPhoneNormalized === currentPhoneNormalized;
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

    const currentPhone = normalizePhone(displayPhone);
    if (currentPhone && formatted === currentPhone) {
      toast({
        title: "Same phone number",
        description: "Enter a different phone number to update.",
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

  const resetEmailDialog = () => {
    setEmailOtpSent(false);
    setEmailOtp("");
    setSendingEmailOtp(false);
    setVerifyingEmailOtp(false);
  };

  const handleEmailDialogOpenChange = (open: boolean) => {
    setEmailDialogOpen(open);
    if (!open) resetEmailDialog();
  };

  const resetPasswordDialog = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setSavingPassword(false);
  };

  const handlePasswordDialogOpenChange = (open: boolean) => {
    setPasswordDialogOpen(open);
    if (!open) resetPasswordDialog();
  };

  const handleSavePassword = async () => {
    if (newPassword.trim().length < 8 || newPassword.trim().length > 72) {
      toast({
        title: "Invalid password",
        description: "Password must be between 8 and 72 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Passwords do not match",
        description: "Confirm password must match your new password.",
        variant: "destructive",
      });
      return;
    }
    if (user?.hasPassword && !currentPassword.trim()) {
      toast({
        title: "Current password required",
        description: "Enter your current password to continue.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    const res = await changePassword({
      ...(user?.hasPassword ? { currentPassword: currentPassword.trim() } : {}),
      newPassword: newPassword.trim(),
    });
    setSavingPassword(false);

    if (!res.success) {
      toast({
        title: "Password update failed",
        description: res.error || "Try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: user?.hasPassword ? "Password changed" : "Password set",
      description: "Your account password has been updated.",
    });
    setPasswordDialogOpen(false);
    resetPasswordDialog();
  };

  const handleSendEmailOtp = async () => {
    const nextEmail = emailDraft.trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes("@")) {
      toast({
        title: "Email required",
        description: "Enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const currentEmail = (user?.email ?? "").trim().toLowerCase();
    if (currentEmail && nextEmail === currentEmail) {
      toast({
        title: "Same email",
        description: "Enter a different email address to update.",
        variant: "destructive",
      });
      return;
    }

    setSendingEmailOtp(true);
    const result = await requestEmailOtp(nextEmail);
    setSendingEmailOtp(false);

    if (!result.success) {
      toast({
        title: "Unable to send OTP",
        description: "error" in result ? result.error : "Try again later.",
        variant: "destructive",
      });
      return;
    }

    setEmailDraft(nextEmail);
    setEmailOtpSent(true);
    setEmailOtp("");
    toast({
      title: "OTP sent",
      description: `Verification code sent to ${nextEmail}`,
    });
  };

  const handleVerifyAndUpdateEmail = async () => {
    const nextEmail = emailDraft.trim().toLowerCase();
    if (!nextEmail || emailOtp.length < 4) {
      toast({
        title: "Enter the code",
        description: "Fill in the verification code from email.",
        variant: "destructive",
      });
      return;
    }

    setVerifyingEmailOtp(true);
    const res = await verifyEmailOtp(nextEmail, emailOtp.trim());
    setVerifyingEmailOtp(false);

    if (!res.success) {
      toast({
        title: "Verification failed",
        description: res.error || "Check the code and try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Email updated",
      description: "Your email has been verified and saved.",
    });
    setEmailDialogOpen(false);
    resetEmailDialog();
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

  const avatarBlock = (
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
        <div className="flex flex-col items-center gap-4 lg:items-center">
          <div className="relative shrink-0">
            <Avatar className="size-20 ring-2 ring-border sm:size-28">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary sm:text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              size="icon"
              className="absolute -bottom-1 -right-1 size-8 rounded-full sm:size-9"
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

          <div className="min-w-0 flex-1 text-center lg:text-center">
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

          <div className="flex w-full flex-wrap justify-center gap-2 sm:w-auto">
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
  );

  const identityForm = (
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input id="profile-email" value={user.email ?? ""} disabled className="sm:flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEmailDraft(user.email ?? "");
                  setEmailOtpSent(false);
                  setEmailOtp("");
                  setEmailDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Change email
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Email updates require OTP verification sent to the new address.
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <Shield className="h-4 w-4 text-primary" />
            Security
          </CardTitle>
          <CardDescription>
            {user.hasPassword
              ? "Change the password you use with phone login."
              : "Set a password so you can sign in with phone and password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-foreground">
                {user.hasPassword ? "Password is set" : "No password set"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use at least 8 characters. You can also recover via Forgot password on login.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetPasswordDialog();
                setPasswordDialogOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {user.hasPassword ? "Change password" : "Set password"}
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
  );

  return (
    <div className="flex w-full min-w-0 max-w-5xl flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
          My Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isVendor
            ? "Manage your account, business details, and KYC verification."
            : "Keep your account information current and verified."}
        </p>
      </div>

      {isVendor ? (
        <VendorProfileStatusBanner
          profile={vendorProfile}
          onGoToKyc={() => setProfileTab("kyc")}
        />
      ) : null}

      {isVendor ? (
        <Tabs value={profileTab} onValueChange={setProfileTab} className="min-w-0 space-y-4">
          <TabsList className="flex h-auto w-full max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="account" className="shrink-0 gap-2">
              <UserCircle className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="business" className="shrink-0 gap-2">
              <Store className="h-4 w-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="kyc" className="shrink-0 gap-2">
              <FileText className="h-4 w-4" />
              KYC documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-0 space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  {avatarBlock}
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <ProfileFact icon={Mail} label="Email" value={user.email ?? "-"} />
                  <ProfileFact icon={Phone} label="Phone" value={displayPhone || "Not verified"} />
                  <ProfileFact icon={Shield} label="Role" value={roleLabel(user.role)} />
                </div>
              </CardContent>
            </Card>
            {identityForm}
          </TabsContent>

          <TabsContent value="business" className="mt-0">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <VendorBusinessForm
                  key={`business-${vendorProfile?.updatedAt ?? "new"}`}
                  profile={vendorProfile ?? null}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="mt-0">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <VendorKycForm
                  key={`kyc-${vendorProfile?.updatedAt ?? "new"}`}
                  profile={vendorProfile ?? null}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Card className="h-fit overflow-hidden">
            <CardContent className="flex flex-col items-center gap-4 p-4 sm:p-6 text-center">
              {avatarBlock}
              <Separator />
              <div className="grid w-full gap-3 text-left">
                <ProfileFact icon={Mail} label="Email" value={user.email ?? "-"} />
                <ProfileFact icon={Phone} label="Phone" value={displayPhone || "Not verified"} />
                <ProfileFact icon={Shield} label="Role" value={roleLabel(user.role)} />
              </div>
            </CardContent>
          </Card>
          {identityForm}
        </div>
      )}

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
                aria-invalid={isSamePhoneAsCurrent}
              />
              {isSamePhoneAsCurrent ? (
                <p className="text-xs text-destructive">
                  This is already your current number. Enter a different phone number.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Include the country code so OTP delivery works reliably.
                </p>
              )}
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
                disabled={sendingOtp || !phoneDraft.trim() || isSamePhoneAsCurrent}
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

      <Dialog open={emailDialogOpen} onOpenChange={handleEmailDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update email</DialogTitle>
            <DialogDescription>
              We&apos;ll send a one-time code to the new address before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="email-change-input">Email address</Label>
              <Input
                id="email-change-input"
                type="email"
                placeholder="you@example.com"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                disabled={emailOtpSent || sendingEmailOtp}
                aria-invalid={
                  !!emailDraft.trim() &&
                  emailDraft.trim().toLowerCase() ===
                    (user?.email ?? "").trim().toLowerCase()
                }
              />
              {emailDraft.trim() &&
              emailDraft.trim().toLowerCase() ===
                (user?.email ?? "").trim().toLowerCase() ? (
                <p className="text-xs text-destructive">
                  This is already your current email. Enter a different address.
                </p>
              ) : null}
            </div>

            {emailOtpSent ? (
              <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <div>
                  <Label>Verification code</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter the code sent to {emailDraft}.
                  </p>
                </div>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={emailOtp}
                    onChange={setEmailOtp}
                    disabled={verifyingEmailOtp}
                  >
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
            {!emailOtpSent ? (
              <Button
                type="button"
                className="w-full"
                onClick={() => void handleSendEmailOtp()}
                disabled={
                  sendingEmailOtp ||
                  !emailDraft.trim() ||
                  emailDraft.trim().toLowerCase() ===
                    (user?.email ?? "").trim().toLowerCase()
                }
              >
                {sendingEmailOtp ? (
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
                  onClick={() => void handleVerifyAndUpdateEmail()}
                  disabled={verifyingEmailOtp || emailOtp.length < 4}
                >
                  {verifyingEmailOtp ? (
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
                  onClick={() => void handleSendEmailOtp()}
                  disabled={sendingEmailOtp}
                >
                  {sendingEmailOtp ? "Sending..." : "Resend code"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={handlePasswordDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {user?.hasPassword ? "Change password" : "Set password"}
            </DialogTitle>
            <DialogDescription>
              {user?.hasPassword
                ? "Enter your current password, then choose a new one."
                : "Choose a password to use with phone login."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {user?.hasPassword ? (
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={savingPassword}
                />
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                disabled={savingPassword}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-new-password">Confirm new password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                disabled={savingPassword}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => void handleSavePassword()}
              disabled={savingPassword}
              className="w-full"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : user?.hasPassword ? (
                "Update password"
              ) : (
                "Set password"
              )}
            </Button>
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
