"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendorProfile, useUpdateVendorProfile } from "@/hooks/use-vendor-profile";
import { api } from "@/lib/api";
import type { VendorCategory } from "@/schema/vendor";
import { useToast } from "@/hooks/use-toast";

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
];

function DocUpload({
  label,
  url,
  onUploaded,
}: {
  label: string;
  url: string;
  onUploaded: (url: string) => void;
}) {
  const { toast } = useToast();
  const upload = async (file: File) => {
    try {
      const { url: uploaded } = await api.uploadFile(file);
      onUploaded(uploaded);
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      {url ? <p className="text-xs text-muted-foreground">Uploaded</p> : null}
    </div>
  );
}

export default function VendorProfileSection() {
  const { data: profile, isLoading } = useVendorProfile();
  const { mutate: save, isPending } = useUpdateVendorProfile();
  const { toast } = useToast();
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("other");
  const [about, setAbout] = useState("");
  const [experience, setExperience] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [slug, setSlug] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [serviceLocations, setServiceLocations] = useState<string[]>([]);
  const [aadhaarUrl, setAadhaarUrl] = useState("");
  const [panUrl, setPanUrl] = useState("");
  const [gstUrl, setGstUrl] = useState("");
  const [businessProofUrl, setBusinessProofUrl] = useState("");
  const [addressProofUrl, setAddressProofUrl] = useState("");
  const [publicPhotoUrls, setPublicPhotoUrls] = useState<string[]>([]);
  const [certificateUrls, setCertificateUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    setBusinessName(profile.businessName ?? "");
    setCategory(profile.category);
    setAbout(profile.about ?? "");
    setExperience(profile.experience ?? "");
    setWorkingHours(profile.workingHours ?? "");
    setSlug(profile.slug ?? "");
    setServiceLocations(profile.serviceLocations ?? []);
    setAadhaarUrl(profile.documents?.aadhaarUrl ?? "");
    setPanUrl(profile.documents?.panUrl ?? "");
    setGstUrl(profile.documents?.gstUrl ?? "");
    setBusinessProofUrl(profile.documents?.businessProofUrl ?? "");
    setAddressProofUrl(profile.documents?.addressProofUrl ?? "");
    setPublicPhotoUrls(profile.publicPhotoUrls ?? []);
    setCertificateUrls(profile.certificateUrls ?? []);
  }, [profile]);

  const addLocation = () => {
    const v = locationInput.trim();
    if (!v || serviceLocations.includes(v)) return;
    setServiceLocations((prev) => [...prev, v]);
    setLocationInput("");
  };

  const uploadGallery = async (
    files: FileList | null,
    setter: Dispatch<SetStateAction<string[]>>,
  ) => {
    if (!files?.length) return;
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await api.uploadFile(file);
        urls.push(url);
      }
      setter((prev) => [...prev, ...urls]);
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const publicLink =
    profile?.verificationStatus === "verified" && profile.userId
      ? `/vendors/${slug.trim() || profile.userId}`
      : null;

  return (
    <div className="rounded-xl border border-border p-5 space-y-6 mt-6">
      <div>
        <h3 className="font-semibold">Partner business profile</h3>
        <p className="text-xs text-muted-foreground capitalize mt-1">
          Verification: {profile?.verificationStatus ?? "pending"}
        </p>
        {publicLink ? (
          <p className="text-xs mt-1">
            Public page:{" "}
            <a href={publicLink} className="text-primary hover:underline" target="_blank" rel="noreferrer">
              {publicLink}
            </a>
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Business name</Label>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
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
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="my-business-name"
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens only. Used in /vendors/your-slug when verified.
        </p>
      </div>

      <div className="space-y-2">
        <Label>About</Label>
        <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Experience</Label>
        <Textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={2} />
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
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
          />
          <Button type="button" variant="secondary" onClick={addLocation}>
            Add
          </Button>
        </div>
        {serviceLocations.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
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
        <h4 className="text-sm font-medium mb-3">KYC documents</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <DocUpload label="Aadhaar" url={aadhaarUrl} onUploaded={setAadhaarUrl} />
          <DocUpload label="PAN" url={panUrl} onUploaded={setPanUrl} />
          <DocUpload label="GST certificate" url={gstUrl} onUploaded={setGstUrl} />
          <DocUpload label="Business proof" url={businessProofUrl} onUploaded={setBusinessProofUrl} />
          <DocUpload label="Address proof" url={addressProofUrl} onUploaded={setAddressProofUrl} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Public gallery photos</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => void uploadGallery(e.target.files, setPublicPhotoUrls)}
        />
        {publicPhotoUrls.length > 0 ? (
          <p className="text-xs text-muted-foreground">{publicPhotoUrls.length} photo(s)</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Certificates (PDF or image)</Label>
        <Input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) => void uploadGallery(e.target.files, setCertificateUrls)}
        />
        {certificateUrls.length > 0 ? (
          <p className="text-xs text-muted-foreground">{certificateUrls.length} file(s)</p>
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
            { onSuccess: () => toast({ title: "Partner profile saved" }) },
          )
        }
      >
        {isPending ? "Saving…" : "Save partner profile"}
      </Button>
    </div>
  );
}
