import { useFormContext } from "react-hook-form";
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
import { useCategories } from "@/hooks/use-categories";

const LISTING_TYPE_OPTIONS = [
  { value: "Rent", label: "Rent" },
  { value: "Sale", label: "For Sale" },
  { value: "Lease", label: "Lease" },
] as const;

export const BasicInformation = () => {
  const { control } = useFormContext<PropertyFormValues>();
  const { data: categories = [] } = useCategories();
  const activeCategories = categories.filter((c) => c.isActive !== false && !c.service);
  const fallback = ["Apartment", "House", "Villa", "Townhome"];
  const propertyTypeOptions = (
    activeCategories.length > 0 ? activeCategories.map((c) => c.name) : fallback
  ).map((opt) => ({ value: opt, label: opt }));

  return (
    <div className="space-y-4 pb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="propertyType"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel required>Property Type</FormLabel>
              <FormControl>
                <Combobox
                  options={propertyTypeOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select type"
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
          name="listingType"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel required>Listing Type</FormLabel>
              <FormControl>
                <Combobox
                  options={LISTING_TYPE_OPTIONS}
                  value={field.value || null}
                  onValueChange={field.onChange}
                  placeholder="Rent or Sale"
                  disableSearch
                  aria-invalid={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Property Title</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Spacious 3BHK in Whitefield" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
