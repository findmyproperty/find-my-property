import { useFormContext } from "react-hook-form";
import { Bed, Bath, Square, Calendar, IndianRupee, Sofa } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PropertyFormValues } from "./schema";

export const PropertyOverview = () => {
  const { control } = useFormContext<PropertyFormValues>();

  return (
    <div className="space-y-4 pb-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <FormField
          control={control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
                <Bed className="w-3.5 h-3.5" /> Rooms
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="BHK" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} Room{n > 1 ? "s" : ""}
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
          name="bathrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
                <Bath className="w-3.5 h-3.5" /> Bathrooms
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Bath" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}+ Bathrooms
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
        render={({ field }) => (
          <FormItem className="max-w-md">
            <FormLabel required className="flex items-center gap-1.5 text-muted-foreground">
              <Sofa className="h-3.5 w-3.5" /> Furnishing
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select furnishing" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="unfurnished">Unfurnished</SelectItem>
                <SelectItem value="semi-furnished">Semi-furnished</SelectItem>
                <SelectItem value="furnished">Furnished</SelectItem>
              </SelectContent>
            </Select>
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
