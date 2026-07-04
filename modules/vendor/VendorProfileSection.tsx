"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Loader2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react"
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetInfo,
} from "next-cloudinary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check } from "lucide-react"
import {
  useVendorProfile,
  useUpdateVendorProfile,
} from "@/hooks/use-vendor-profile"
import type { VendorProfile } from "@/schema/vendor"
import { useCategories } from "@/hooks/use-categories"
import { useToast } from "@/hooks/use-toast"
import WorkingHoursPicker from "@/modules/vendor/WorkingHoursPicker"
import { cn } from "@/lib/utils"

const MB = 1024 * 1024

const REQUIRED_KYC = ["Aadhaar", "PAN"] as const

function DocUpload({
  label,
  url,
  onUploaded,
  required,
}: {
  label: string
  url: string
  onUploaded: (url: string) => void
  required?: boolean
}) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  const openWidget = (open: () => void) => {
    if (isUploading) return
    if (!cloudinaryPreset) {
      toast({
        title: "Uploads unavailable",
        description:
          "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
        variant: "destructive",
      })
      return
    }
    setIsUploading(true)
    open()
  }

  const handleSuccess = (info: CloudinaryUploadWidgetInfo | undefined) => {
    setIsUploading(false)
    const uploadedUrl = info?.secure_url
    if (!uploadedUrl) return
    onUploaded(uploadedUrl)
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border bg-muted/20 p-3",
        url ? "border-emerald-500/30" : "border-border",
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <Label className="flex items-center gap-1.5">
          {label}
          {required ? <span className="text-destructive">*</span> : null}
          {url ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          ) : null}
        </Label>
        {url ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 shrink-0 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onUploaded("")}
            disabled={isUploading}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>

      <CldUploadWidget
        uploadPreset={cloudinaryPreset}
        options={{
          multiple: false,
          maxFileSize: 10 * MB,
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "pdf"],
          resourceType: "auto",
          folder: "vendor-kyc",
          sources: ["local", "url", "camera"],
        }}
        onSuccess={(result) => {
          if (result.event !== "success") return
          const info = result.info
          if (info && typeof info !== "string") {
            handleSuccess(info as CloudinaryUploadWidgetInfo)
          } else {
            setIsUploading(false)
          }
        }}
        onError={(error) => {
          setIsUploading(false)
          toast({
            title: "Upload failed",
            description:
              typeof error === "string" ? error : "Please try again.",
            variant: "destructive",
          })
        }}
        onClose={() => setIsUploading(false)}
      >
        {({ open }) => (
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant={url ? "outline" : "secondary"}
              size="sm"
              className="w-full shrink-0 sm:w-auto"
              disabled={isUploading}
              onClick={() => openWidget(open)}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : url ? (
                <FileCheck2 className="mr-2 h-3.5 w-3.5" />
              ) : (
                <Upload className="mr-2 h-3.5 w-3.5" />
              )}
              {isUploading ? "Uploading..." : url ? "Replace" : "Upload"}
            </Button>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                View uploaded file
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">
                Image or PDF, up to 10 MB
              </span>
            )}
          </div>
        )}
      </CldUploadWidget>
    </div>
  )
}

function StickySaveBar({
  label,
  isPending,
  onSave,
}: {
  label: string
  isPending: boolean
  onSave: () => void
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-6 border-t border-border bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Button className="w-full sm:w-auto" disabled={isPending} onClick={onSave}>
        {isPending ? "Saving…" : label}
      </Button>
    </div>
  )
}

function VerificationBadge({ status }: { status: string }) {
  const variant =
    status === "verified"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status === "rejected"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"

  return (
    <Badge variant="outline" className={cn("capitalize", variant)}>
      {status}
    </Badge>
  )
}

export function VendorProfileStatusBanner({
  profile,
  onGoToKyc,
}: {
  profile: VendorProfile | null | undefined
  onGoToKyc?: () => void
}) {
  if (!profile || profile.verificationStatus === "verified") return null

  const docs = profile.documents
  const requiredDone =
    Boolean(docs?.aadhaarUrl?.trim()) && Boolean(docs?.panUrl?.trim())

  return (
    <Alert
      variant={profile.verificationStatus === "rejected" ? "destructive" : "default"}
      className="border-primary/20 bg-primary/5"
    >
      <ShieldCheck className="h-4 w-4" />
      <AlertTitle>
        {profile.verificationStatus === "rejected"
          ? "Verification rejected"
          : "Complete partner verification"}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        {profile.verificationStatus === "rejected" && profile.rejectionReason ? (
          <p>{profile.rejectionReason}</p>
        ) : (
          <p>
            Fill in your business profile and upload KYC documents (Aadhaar & PAN
            required). Admin will review before you can accept leads.
          </p>
        )}
        {!requiredDone && onGoToKyc ? (
          <Button type="button" size="sm" variant="secondary" onClick={onGoToKyc}>
            Go to KYC documents
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}

export function VendorBusinessForm({ profile }: { profile: VendorProfile | null }) {
  const { mutate: save, isPending } = useUpdateVendorProfile()
  const { toast } = useToast()
  const { data: allCategories = [] } = useCategories()
  const categoryOptions = useMemo(
    () =>
      allCategories
        .filter((c) => c.isActive !== false)
        .map((c) => ({ value: c.id.toString(), label: c.name, id: c.id })),
    [allCategories],
  )

  const [businessName, setBusinessName] = useState(
    () => profile?.businessName ?? "",
  )
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    () => (profile?.categories ? profile.categories.map((c: any) => c.id) : []),
  )
  const [about, setAbout] = useState(() => profile?.about ?? "")
  const [experience, setExperience] = useState(() => profile?.experience ?? "")
  const [workingHours, setWorkingHours] = useState(
    () => profile?.workingHours ?? "",
  )
  const [locationInput, setLocationInput] = useState("")
  const [serviceLocations, setServiceLocations] = useState<string[]>(
    () => profile?.serviceLocations ?? [],
  )

  const publicLink =
    profile?.verificationStatus === "verified" && profile.userId
      ? `/vendors/${profile.slug?.trim() || profile.userId}`
      : null

  const addLocation = () => {
    const v = locationInput.trim()
    if (!v || serviceLocations.includes(v)) return
    setServiceLocations((prev) => [...prev, v])
    setLocationInput("")
  }

  const addCategory = (id: number) => {
    if (!selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds((prev) => [...prev, id])
    }
  }

  const removeCategory = (id: number) => {
    setSelectedCategoryIds((prev) => prev.filter((v) => v !== id))
  }

  const handleSave = () => {
    save(
      {
        businessName,
        categoryIds: selectedCategoryIds,
        about,
        experience,
        workingHours,
        serviceLocations,
      },
      { onSuccess: () => toast({ title: "Business profile saved" }) },
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-heading text-lg font-semibold">Business profile</h3>
          <p className="text-sm text-muted-foreground">
            Shown to customers after admin verification.
          </p>
        </div>
        <VerificationBadge status={profile?.verificationStatus ?? "pending"} />
      </div>

      {publicLink ? (
        <p className="text-sm text-muted-foreground">
          Public page:{" "}
          <a
            href={publicLink}
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {publicLink}
          </a>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vendor-business-name">Business name</Label>
          <Input
            id="vendor-business-name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your company or trade name"
          />
        </div>
        <div className="space-y-2">
          <Label>Categories</Label>
          <Popover>
            <PopoverTrigger asChild>
              <div
                className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex flex-wrap gap-1 items-center cursor-pointer hover:bg-accent"
                role="combobox"
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
                        className="gap-1"
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
                          value={opt.value}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor-about">About your business</Label>
        <Textarea
          id="vendor-about"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={3}
          placeholder="Services you offer, years in business, specialties…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor-experience">Experience</Label>
        <Textarea
          id="vendor-experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={2}
          placeholder="Relevant experience and credentials"
        />
      </div>

      <WorkingHoursPicker value={workingHours} onChange={setWorkingHours} />

      <div className="space-y-2">
        <Label htmlFor="vendor-location">Service locations</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="vendor-location"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="e.g. South Delhi"
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addLocation())
            }
          />
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 sm:w-auto"
            onClick={addLocation}
          >
            Add area
          </Button>
        </div>
        {serviceLocations.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {serviceLocations.map((loc) => (
              <Badge key={loc} variant="secondary" className="gap-1">
                {loc}
                <button
                  type="button"
                  aria-label={`Remove ${loc}`}
                  onClick={() =>
                    setServiceLocations((prev) => prev.filter((l) => l !== loc))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Add cities or areas where you provide services.
          </p>
        )}
      </div>

      <StickySaveBar
        label="Save business profile"
        isPending={isPending}
        onSave={handleSave}
      />
    </div>
  )
}

export function VendorKycForm({ profile }: { profile: VendorProfile | null }) {
  const { mutate: save, isPending } = useUpdateVendorProfile()
  const { toast } = useToast()
  const [aadhaarUrl, setAadhaarUrl] = useState(
    () => profile?.documents?.aadhaarUrl ?? "",
  )
  const [panUrl, setPanUrl] = useState(() => profile?.documents?.panUrl ?? "")
  const [gstUrl, setGstUrl] = useState(() => profile?.documents?.gstUrl ?? "")
  const [businessProofUrl, setBusinessProofUrl] = useState(
    () => profile?.documents?.businessProofUrl ?? "",
  )
  const [addressProofUrl, setAddressProofUrl] = useState(
    () => profile?.documents?.addressProofUrl ?? "",
  )

  const uploadedCount = useMemo(
    () =>
      [aadhaarUrl, panUrl, gstUrl, businessProofUrl, addressProofUrl].filter(
        Boolean,
      ).length,
    [aadhaarUrl, panUrl, gstUrl, businessProofUrl, addressProofUrl],
  )

  const requiredComplete = Boolean(aadhaarUrl.trim()) && Boolean(panUrl.trim())

  const handleSave = () => {
    save(
      {
        documents: {
          aadhaarUrl: aadhaarUrl || null,
          panUrl: panUrl || null,
          gstUrl: gstUrl || null,
          businessProofUrl: businessProofUrl || null,
          addressProofUrl: addressProofUrl || null,
        },
      },
      {
        onSuccess: () =>
          toast({
            title: requiredComplete
              ? "KYC saved — pending admin review"
              : "Documents saved",
            description: requiredComplete
              ? undefined
              : "Upload Aadhaar and PAN to submit for verification.",
          }),
      },
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-lg font-semibold">KYC documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload identity and business proofs. Admin uses these to verify your
          partner account.
        </p>
      </div>

      <Alert className="border-border bg-muted/30">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Verification checklist</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            <span className="font-medium text-foreground">{uploadedCount} of 5</span>{" "}
            documents uploaded.
            {requiredComplete ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                {" "}
                Required docs complete.
              </span>
            ) : (
              <span>
                {" "}
                Required: {REQUIRED_KYC.join(" & ")}.
              </span>
            )}
          </p>
          <ul className="list-inside list-disc text-sm">
            {REQUIRED_KYC.map((doc) => (
              <li key={doc}>
                {doc}{" "}
                {(doc === "Aadhaar" ? aadhaarUrl : panUrl) ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    (uploaded)
                  </span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-300">
                    (required)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <DocUpload
          label="Aadhaar"
          url={aadhaarUrl}
          onUploaded={setAadhaarUrl}
          required
        />
        <DocUpload label="PAN" url={panUrl} onUploaded={setPanUrl} required />
        <DocUpload
          label="GST certificate"
          url={gstUrl}
          onUploaded={setGstUrl}
        />
        <DocUpload
          label="Business proof"
          url={businessProofUrl}
          onUploaded={setBusinessProofUrl}
        />
        <DocUpload
          label="Address proof"
          url={addressProofUrl}
          onUploaded={setAddressProofUrl}
        />
      </div>

      <StickySaveBar
        label="Save KYC documents"
        isPending={isPending}
        onSave={handleSave}
      />
    </div>
  )
}

export default function VendorProfileSection() {
  const { data: profile, isLoading } = useVendorProfile()

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <VendorBusinessForm profile={profile ?? null} />
      <VendorKycForm profile={profile ?? null} />
    </div>
  )
}
