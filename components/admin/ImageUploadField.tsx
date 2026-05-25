"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { CldUploadWidget, type CloudinaryUploadWidgetInfo } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * Cloudinary-backed image uploader for admin branding fields (logo, favicon).
 * Uploads go to the configured unsigned preset; URLs are saved via settings PATCH.
 */
export interface ImageUploadFieldProps {
  /** Current stored URL — `null`/empty means no image. */
  value: string | null | undefined;
  onChange: (nextUrl: string | null) => void;
  label: string;
  description?: string;
  /** Accept list, e.g. `"image/png,image/jpeg,image/svg+xml,image/x-icon"`. */
  accept?: string;
  /** Max file size in MB. Files larger than this are rejected by the widget. */
  maxSizeMb?: number;
  /** Visual aspect ratio for the preview tile. */
  aspect?: "square" | "wide";
  /** Disables all interactions. */
  disabled?: boolean;
  className?: string;
}

const MB = 1024 * 1024;

function acceptToCloudinaryFormats(accept: string): string[] {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
  };
  const formats = accept
    .split(",")
    .map((part) => map[part.trim()])
    .filter((f): f is string => Boolean(f));
  return formats.length > 0 ? formats : ["png", "jpg", "webp", "svg"];
}

export function ImageUploadField({
  value,
  onChange,
  label,
  description,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon",
  maxSizeMb = 5,
  aspect = "square",
  disabled,
  className,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const inputId = useId();
  const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const sizeClass = aspect === "wide" ? "h-36 w-full max-w-sm" : "h-36 w-36";

  const openWidget = (open: () => void) => {
    if (disabled || isUploading) return;
    if (!cloudinaryPreset) {
      toast({
        title: "Uploads unavailable",
        description: "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    open();
  };

  const handleSuccess = (info: CloudinaryUploadWidgetInfo | undefined) => {
    setIsUploading(false);
    const url = info?.secure_url;
    if (!url) return;
    onChange(url);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onChange(null)}
            disabled={disabled || isUploading}
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
          maxFileSize: maxSizeMb * MB,
          clientAllowedFormats: acceptToCloudinaryFormats(accept),
          folder: aspect === "square" ? "branding/favicons" : "branding/logos",
          sources: ["local", "url"],
          ...(aspect === "square"
            ? {
                cropping: true,
                croppingAspectRatio: 1,
                showSkipCropButton: false,
              }
            : {
                cropping: false,
              }),
        }}
        onSuccess={(result) => {
          if (result.event !== "success") return;
          const info = result.info;
          if (info && typeof info !== "string") {
            handleSuccess(info as CloudinaryUploadWidgetInfo);
          } else {
            setIsUploading(false);
          }
        }}
        onError={(error) => {
          setIsUploading(false);
          toast({
            title: "Upload failed",
            description: typeof error === "string" ? error : "Please try again.",
            variant: "destructive",
          });
        }}
        onClose={() => setIsUploading(false)}
      >
        {({ open }) => (
          <>
            <div
              role="button"
              tabIndex={0}
              id={inputId}
              aria-disabled={disabled}
              onClick={() => openWidget(open)}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openWidget(open);
                }
              }}
              className={cn(
                "relative w-full overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                "bg-muted/30 text-muted-foreground",
                "cursor-pointer hover:border-primary/60 hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                sizeClass,
                disabled && "cursor-not-allowed opacity-60",
                !value && "flex items-center justify-center",
              )}
            >
              {value ? (
                <Image
                  src={value}
                  alt={label}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  unoptimized
                  className="object-contain p-4"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 px-3 text-center">
                  <ImageIcon className="h-5 w-5" aria-hidden />
                  <div className="text-xs font-medium text-foreground">
                    Click to upload via Cloudinary
                  </div>
                  {description ? (
                    <div className="text-[11px] leading-tight text-muted-foreground">
                      {description}
                    </div>
                  ) : null}
                </div>
              )}

              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openWidget(open)}
                disabled={disabled || isUploading}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {value ? "Replace" : "Upload"}
              </Button>
              {value ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-muted-foreground hover:text-foreground"
                >
                  {value}
                </a>
              ) : null}
            </div>
          </>
        )}
      </CldUploadWidget>
    </div>
  );
}
