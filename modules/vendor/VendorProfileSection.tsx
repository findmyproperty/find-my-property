"use client"

import { useState, type Dispatch, type SetStateAction } from "react"
import { ExternalLink, FileCheck2, Loader2, Upload, X } from "lucide-react"
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetInfo,
} from "next-cloudinary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useVendorProfile,
  useUpdateVendorProfile,
} from "@/hooks/use-vendor-profile"
import { api } from "@/lib/api"
import type { VendorCategory, VendorProfile } from "@/schema/vendor"
import { useToast } from "@/hooks/use-toast"

const MB = 1024 * 1024

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: "real_estate", label: "Real estate" },
  { value: "home_services", label: "Home services" },
  { value: "packers", label: "Packers & movers" },
  { value: "lawyer", label: "Lawyer" },
  { value: "ca", label: "Chartered accountant (CA)" },
  { value: "web_designer", label: "Web designer" },
  { value: "trainer", label: "Trainer" },
  { value: "tutor", label: "Tutor" },
  { value: "other", label: "Other" },
]

function DocUpload({
  label,
  url,
  onUploaded,
}: {
  label: string
  url: string
  onUploaded: (url: string) => void
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
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {url ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={url ? "outline" : "secondary"}
              size="sm"
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
                className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
              >
                Uploaded document
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
    <VendorProfileForm
      key={profile?.id ?? "new-vendor-profile"}
      profile={profile ?? null}
    />
  )
}

function VendorProfileForm({ profile }: { profile: VendorProfile | null }) {
  const { mutate: save, isPending } = useUpdateVendorProfile()
  const { toast } = useToast()
  const [businessName, setBusinessName] = useState(
    () => profile?.businessName ?? ""
  )
  const [category, setCategory] = useState<VendorCategory>(
    () => profile?.category ?? "other"
  )
  const [about, setAbout] = useState(() => profile?.about ?? "")
  const [experience, setExperience] = useState(() => profile?.experience ?? "")
  const [workingHours, setWorkingHours] = useState(
    () => profile?.workingHours ?? ""
  )
  const [slug, setSlug] = useState(() => profile?.slug ?? "")
  const [locationInput, setLocationInput] = useState("")
  const [serviceLocations, setServiceLocations] = useState<string[]>(
    () => profile?.serviceLocations ?? []
  )
  const [aadhaarUrl, setAadhaarUrl] = useState(
    () => profile?.documents?.aadhaarUrl ?? ""
  )
  const [panUrl, setPanUrl] = useState(() => profile?.documents?.panUrl ?? "")
  const [gstUrl, setGstUrl] = useState(() => profile?.documents?.gstUrl ?? "")
  const [businessProofUrl, setBusinessProofUrl] = useState(
    () => profile?.documents?.businessProofUrl ?? ""
  )
  const [addressProofUrl, setAddressProofUrl] = useState(
    () => profile?.documents?.addressProofUrl ?? ""
  )
  const [publicPhotoUrls, setPublicPhotoUrls] = useState<string[]>(
    () => profile?.publicPhotoUrls ?? []
  )
  const [certificateUrls, setCertificateUrls] = useState<string[]>(
    () => profile?.certificateUrls ?? []
  )

  const addLocation = () => {
    const v = locationInput.trim()
    if (!v || serviceLocations.includes(v)) return
    setServiceLocations((prev) => [...prev, v])
    setLocationInput("")
  }

  const uploadGallery = async (
    files: FileList | null,
    setter: Dispatch<SetStateAction<string[]>>
  ) => {
    if (!files?.length) return
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const { url } = await api.uploadFile(file)
        urls.push(url)
      }
      setter((prev) => [...prev, ...urls])
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    }
  }

  const publicLink =
    profile?.verificationStatus === "verified" && profile.userId
      ? `/vendors/${slug.trim() || profile.userId}`
      : null

  return (
    <div className="mt-6 space-y-6 rounded-xl border border-border p-5">
      <div>
        <h3 className="font-semibold">Partner business profile</h3>
        <p className="mt-1 text-xs text-muted-foreground capitalize">
          Verification: {profile?.verificationStatus ?? "pending"}
        </p>
        {publicLink ? (
          <p className="mt-1 text-xs">
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Business name</Label>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as VendorCategory)}
          >
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
      </div>

      <div className="space-y-2">
        <Label>Public URL slug (optional)</Label>
        <Input
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
          }
          placeholder="my-business-name"
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens only. Used in
          /vendors/your-slug when verified.
        </p>
      </div>

      <div className="space-y-2">
        <Label>About</Label>
        <Textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Experience</Label>
        <Textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Working hours</Label>
        <Input
          value={workingHours}
          onChange={(e) => setWorkingHours(e.target.value)}
          placeholder="Mon–Sat 9am–6pm"
        />
      </div>

      <div className="space-y-2">
        <Label>Service locations</Label>
        <div className="flex gap-2">
          <Input
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="e.g. South Delhi"
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addLocation())
            }
          />
          <Button type="button" variant="secondary" onClick={addLocation}>
            Add
          </Button>
        </div>
        {serviceLocations.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
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
        ) : null}
      </div>

      <div>
        <h4 className="mb-3 text-sm font-medium">KYC documents</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <DocUpload
            label="Aadhaar"
            url={aadhaarUrl}
            onUploaded={setAadhaarUrl}
          />
          <DocUpload label="PAN" url={panUrl} onUploaded={setPanUrl} />
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
      </div>

      <div className="space-y-2">
        <Label>Public gallery photos</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            void uploadGallery(e.target.files, setPublicPhotoUrls)
          }
        />
        {publicPhotoUrls.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {publicPhotoUrls.length} photo(s)
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Certificates (PDF or image)</Label>
        <Input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) =>
            void uploadGallery(e.target.files, setCertificateUrls)
          }
        />
        {certificateUrls.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {certificateUrls.length} file(s)
          </p>
        ) : null}
      </div>

      <Button
        disabled={isPending}
        onClick={() =>
          save(
            {
              businessName,
              category,
              about,
              experience,
              workingHours,
              serviceLocations,
              slug: slug.trim() || null,
              publicPhotoUrls,
              certificateUrls,
              documents: {
                aadhaarUrl: aadhaarUrl || null,
                panUrl: panUrl || null,
                gstUrl: gstUrl || null,
                businessProofUrl: businessProofUrl || null,
                addressProofUrl: addressProofUrl || null,
              },
            },
            { onSuccess: () => toast({ title: "Partner profile saved" }) }
          )
        }
      >
        {isPending ? "Saving…" : "Save partner profile"}
      </Button>
    </div>
  )
}
