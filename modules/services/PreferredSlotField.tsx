"use client";

import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { availableSlotOptions } from "./schemas";

/** Preferred time slot that hides elapsed slots when the preferred date is today. */
export function PreferredSlotField({
  dateFieldName = "preferredDate",
  slotFieldName = "preferredSlot",
}: {
  dateFieldName?: string;
  slotFieldName?: string;
}) {
  const { control, setValue } = useFormContext();
  const preferredDate = useWatch({ control, name: dateFieldName }) as string | undefined;
  const preferredSlot = useWatch({ control, name: slotFieldName }) as string | undefined;
  const options = useMemo(
    () => availableSlotOptions(preferredDate),
    [preferredDate],
  );

  useEffect(() => {
    if (!preferredSlot) return;
    if (!options.some((option) => option.value === preferredSlot)) {
      setValue(slotFieldName, undefined, { shouldValidate: true });
    }
  }, [options, preferredSlot, setValue, slotFieldName]);

  return (
    <FormField
      control={control}
      name={slotFieldName}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>Preferred slot</FormLabel>
          <FormControl>
            <Combobox
              options={options}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              placeholder={
                options.length === 0 ? "No slots left today" : "Anytime"
              }
              disableSearch
              disabled={options.length === 0}
              aria-invalid={!!fieldState.error}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
