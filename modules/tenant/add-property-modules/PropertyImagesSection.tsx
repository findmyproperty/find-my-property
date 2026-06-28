import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2, Upload, CheckCircle2, Trash2 } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PropertyFormValues } from "./schema";
import { PropertyImagePreview } from "./PropertyImagePreview";
import { CldUploadWidget } from "next-cloudinary";

export const PropertyImagesSection = () => {
  const { control, setValue, watch, getValues } = useFormContext<PropertyFormValues>();
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  const propertyImages = watch("propertyImages") || [];
  const thumbnailUrl = watch("thumbnailUrl");

  return (
    <div className="space-y-4 pb-2">
      <p className="text-sm text-muted-foreground">
        Upload images of the property. Select one to act as the main thumbnail.
      </p>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] relative">
        {uploadingImage ? (
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        ) : (
          <Upload className="w-10 h-10 text-muted-foreground" />
        )}
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{ multiple: true, clientAllowedFormats: ["image"] }}
          onSuccess={(result) => {
            if (result.event === "success" && result.info) {
              const info = result.info as any;
              const currentImgs = getValues("propertyImages") || [];
              const newImgs = [...currentImgs, info.secure_url];
              setValue("propertyImages", newImgs, { shouldValidate: true });
              if (!getValues("thumbnailUrl")) {
                setValue("thumbnailUrl", info.secure_url, { shouldValidate: true });
              }
            }
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="cursor-pointer text-sm font-medium text-primary hover:underline flex flex-col items-center gap-2 relative z-10"
            >
              <span className="flex items-center gap-1.5"><Upload className="w-4 h-4" /> Click to upload image</span>
            </button>
          )}
        </CldUploadWidget>
      </div>

      <FormField
        control={control}
        name="propertyImages"
        render={() => <FormMessage />}
      />
      
      {propertyImages.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <Label className="mb-3 block font-semibold text-foreground">Select Thumbnail:</Label>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {propertyImages.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setValue("thumbnailUrl", url, { shouldValidate: true })}
                className={cn(
                  "relative min-w-[120px] w-[120px] h-[90px] rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
                  thumbnailUrl === url ? "border-primary shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img src={url} alt={`Property ${idx}`} className="w-full h-full object-cover" />
                {thumbnailUrl === url && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentImgs = getValues("propertyImages") || [];
                    const newImgs = currentImgs.filter((_, i) => i !== idx);
                    setValue("propertyImages", newImgs, { shouldValidate: true });
                    if (thumbnailUrl === url) {
                      setValue("thumbnailUrl", newImgs[0] || "", { shouldValidate: true });
                    }
                  }}
                  className="absolute top-1 left-1 bg-destructive/90 text-destructive-foreground p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {thumbnailUrl ? (
        <PropertyImagePreview imageUrl={thumbnailUrl} />
      ) : null}
    </div>
  );
};
