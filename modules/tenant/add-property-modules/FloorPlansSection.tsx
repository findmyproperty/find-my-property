import { useFormContext, useFieldArray } from "react-hook-form";
import { Bath, Bed, Upload, Trash2, Plus } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertyFormValues } from "./schema";
import { CldUploadWidget } from "next-cloudinary";

const SUGGESTED_FLOOR_NAMES = [
  { value: "ground", label: "Ground" },
  { value: "first", label: "First" },
  { value: "second", label: "Second" },
  { value: "third", label: "Third" },
  { value: "fourth", label: "Fourth" },
  { value: "basement", label: "Basement" },
  { value: "other", label: "Other" },
];

export const FloorPlansSection = () => {
  const { control, setValue, watch } = useFormContext<PropertyFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "floorPlans",
  });

  const getFloorDisplayLabel = (index: number) => {
    const fp = watch(`floorPlans.${index}`);
    if (!fp) return "Floor";
    const trimmed = fp.customName?.trim();
    if (trimmed) return trimmed;
    return SUGGESTED_FLOOR_NAMES.find((f) => f.value === fp.floorName)?.label ?? fp.floorName;
  };

  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Suggested</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Living spaces are easier to understand with floor plans. Add a plan for each floor so buyers or tenants can
        see the layout clearly.
      </p>
      
      <div className="space-y-4">
        {fields.map((field, index) => {
          const floorName = watch(`floorPlans.${index}.floorName`);
          return (
            <div key={field.id} className="rounded-xl border border-border p-4 space-y-4 bg-muted/20">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-muted-foreground">Floor {index + 1}</Label>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name={`floorPlans.${index}.floorName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor name (pick suggested)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose floor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUGGESTED_FLOOR_NAMES.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`floorPlans.${index}.rooms`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
                        <Bed className="w-3.5 h-3.5" /> Rooms (BHK)
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="BHK" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} BHK
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`floorPlans.${index}.bathrooms`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
                        <Bath className="w-3.5 h-3.5" /> Bath
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Bath" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} Bath{n > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {floorName === "other" && (
                  <FormField
                    control={control}
                    name={`floorPlans.${index}.customName`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Or enter custom floor name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Penthouse, Mezzanine, Terrace" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <FormField
                control={control}
                name={`floorPlans.${index}.imageUrl`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] relative mt-2">
                      <Upload className="w-10 h-10 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder={`Floor plan image URL for ${getFloorDisplayLabel(index)} floor`}
                          className="max-w-md relative z-10"
                          {...inputField}
                        />
                      </FormControl>
                      <CldUploadWidget
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                        options={{ multiple: false, clientAllowedFormats: ["image"] }}
                        onSuccess={(result) => {
                          if (result.event === "success" && result.info) {
                            const info = result.info as { secure_url?: unknown };
                            if (typeof info.secure_url === "string") {
                              setValue(`floorPlans.${index}.imageUrl`, info.secure_url, { shouldValidate: true });
                            }
                          }
                        }}
                      >
                        {({ open }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            className="cursor-pointer text-xs text-primary hover:underline relative z-10 flex flex-col items-center"
                          >
                            <span className="flex gap-1.5 items-center mt-2"><Upload className="w-4 h-4" /> Upload image or click here</span>
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
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              id: String(Date.now()),
              floorName: "other",
              customName: "",
              rooms: "",
              bathrooms: "",
              imageUrl: "",
            })
          }
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> Add another floor
        </Button>
      </div>
    </div>
  );
};
