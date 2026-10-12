import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2, Upload, Video } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { PropertyFormValues } from "./schema";
import { CldUploadWidget } from "next-cloudinary";

export const VideoSection = () => {
  const { control, setValue } = useFormContext<PropertyFormValues>();
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-4 pb-2">
      <p className="text-sm text-muted-foreground">
        Add a video URL (YouTube, Vimeo) or upload a video to showcase your property.
      </p>
      
      <FormField
        control={control}
        name="videoUrl"
        render={({ field }) => (
          <FormItem>
            <div className="rounded-lg border border-border bg-muted/30 p-6 flex flex-col items-center justify-center gap-3 min-h-[180px] relative">
              {uploadingVideo ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : (
                <Video className="w-10 h-10 text-muted-foreground" />
              )}
              <FormControl>
                <Input
                  placeholder="Paste video URL (e.g. YouTube or Vimeo)"
                  className="max-w-md relative z-10"
                  {...field}
                />
              </FormControl>
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                options={{ multiple: false, clientAllowedFormats: ["video"] }}
                onSuccess={(result) => {
                  if (result.event === "success" && result.info) {
                    const info = result.info as any;
                    setValue("videoUrl", info.secure_url, { shouldValidate: true, shouldDirty: true });
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="cursor-pointer text-xs text-primary hover:underline relative z-10 flex flex-col items-center"
                  >
                    <span className="flex gap-1.5 items-center mt-2"><Upload className="w-4 h-4" /> or click to upload video file</span>
                  </button>
                )}
              </CldUploadWidget>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
