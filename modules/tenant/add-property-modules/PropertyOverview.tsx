import { useFormContext } from "react-hook-form";
import { Bed, Bath, Square, Calendar, IndianRupee, Sofa } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import type { PropertyFormValues } from "./schema";

const ROOM_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: `${n} Room${n > 1 ? "s" : ""}`,
}));

const BATH_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: `${n}+ Bathrooms`,
}));

const FURNISHING_OPTIONS = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi-furnished", label: "Semi-furnished" },
  { value: "furnished", label: "Furnished" },
] as const;

export const PropertyOverview = () => {
  const { control } = useFormContext<PropertyFormValues>();

  return (
    <div className="space-y-4 pb-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <FormField
          control={control}
          name="bedrooms"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
                <Bed className="w-3.5 h-3.5" /> Rooms
              </FormLabel>
              <FormControl>
                <Combobox
                  options={ROOM_OPTIONS}
                  value={field.value || null}
                  onValueChange={field.onChange}
                  placeholder="BHK"
                  disableSearch
                  aria-invalid={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="bathrooms"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
                <Bath className="w-3.5 h-3.5" /> Bathrooms
              </FormLabel>
              <FormControl>
                <Combobox
                  options={BATH_OPTIONS}
                  value={field.value || null}
                  onValueChange={field.onChange}
                  placeholder="Bath"
                  disableSearch
                  aria-invalid={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
                <Square className="w-3.5 h-3.5" /> Area
              </FormLabel>
              <FormControl>
                <Input placeholder="1,450 sq.ft" type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="yearBuilt"
          render={({ field }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" /> Year Built
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. 2012" type="number" min={1900} max={new Date().getFullYear() + 5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="furnishing"
        render={({ field, fieldState }) => (
          <FormItem className="max-w-md">
            <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
              <Sofa className="h-3.5 w-3.5" /> Furnishing
            </FormLabel>
            <FormControl>
              <Combobox
                options={FURNISHING_OPTIONS}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Select furnishing"
                disableSearch
                aria-invalid={!!fieldState.error}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Price (₹)</FormLabel>
            <FormControl>
              <div className="relative max-w-xs">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="number" placeholder="Monthly rent or sale price" className="pl-10" {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
