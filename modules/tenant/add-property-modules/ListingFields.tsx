"use client";

import { useFormContext, useWatch, type FieldPath } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { PropertyFormValues } from "./schema";
import type { ListingDetails } from "@/lib/property-posting";
import { PG_ROOM_AMENITIES, PG_ROOM_TYPES, pgRuleOptions } from "./listing-options";
import type { ListingField } from "./listing-sections";

function visible(field: ListingField, details: ListingDetails) {
  return field.show ? field.show(details) : true;
}

export function ListingFields({ fields }: { fields: ListingField[] }) {
  const { control } = useFormContext<PropertyFormValues>();
  const details = useWatch({ control, name: "details" }) ?? {};

  return (
    <div className="space-y-4">
      {fields.filter((field) => visible(field, details)).map((field) =>
        field.kind === "pgRooms" ? (
          <PgRoomsField key={field.name} />
        ) : (
          <ListingControl key={field.name} field={field} details={details} />
        ),
      )}
    </div>
  );
}

function ListingControl({ field, details }: { field: ListingField; details: ListingDetails }) {
  const { control } = useFormContext<PropertyFormValues>();
  const name = field.name as FieldPath<PropertyFormValues>;
  const options = field.name === "details.rules" ? pgRuleOptions(details.availableFor) : field.options;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel required={field.required}>{field.label}</FormLabel>
          {field.kind === "textarea" ? (
            <FormControl>
              <Textarea rows={4} placeholder={field.placeholder} {...formField} value={stringValue(formField.value)} />
            </FormControl>
          ) : null}
          {field.kind === "text" || field.kind === "number" || field.kind === "date" || field.kind === "time" ? (
            <FormControl>
              <Input
                type={field.kind === "text" ? "text" : field.kind}
                min={field.kind === "number" ? 0 : undefined}
                placeholder={field.placeholder}
                {...formField}
                value={stringValue(formField.value)}
              />
            </FormControl>
          ) : null}
          {field.kind === "select" ? (
            <Select value={stringValue(formField.value) || undefined} onValueChange={formField.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(options ?? []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {field.kind === "radio" || field.kind === "yesno" ? (
            <FormControl>
              <RadioGroup
                value={stringValue(formField.value)}
                onValueChange={formField.onChange}
                className="flex flex-wrap gap-3"
              >
                {(field.kind === "yesno" ? [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] : options ?? []).map(
                  (option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
                      <RadioGroupItem value={option.value} />
                      {option.label}
                    </label>
                  ),
                )}
              </RadioGroup>
            </FormControl>
          ) : null}
          {field.kind === "checks" ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(options ?? []).map((option) => {
                const selected = Array.isArray(formField.value) ? formField.value.map(String) : [];
                const checked = selected.includes(option.value);
                return (
                  <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) => {
                        formField.onChange(
                          next ? [...selected, option.value] : selected.filter((item) => item !== option.value),
                        );
                      }}
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          ) : null}
          {field.kind === "stepper" ? (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => formField.onChange(String(Math.max(0, Number(formField.value || 0) - 1)))}
              >
                −
              </Button>
              <span className="w-8 text-center text-sm">{stringValue(formField.value) || "0"}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => formField.onChange(String(Number(formField.value || 0) + 1))}
              >
                +
              </Button>
            </div>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function PgRoomsField() {
  const { control, setValue } = useFormContext<PropertyFormValues>();
  const roomTypes = useWatch({ control, name: "details.roomTypes" }) ?? [];
  const rooms = useWatch({ control, name: "details.rooms" }) ?? {};

  const toggleType = (value: string, checked: boolean) => {
    const next = checked ? [...roomTypes, value] : roomTypes.filter((item) => item !== value);
    setValue("details.roomTypes", next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-foreground">Select the type of rooms available</p>
      <div className="flex flex-wrap gap-3">
        {PG_ROOM_TYPES.map((room) => (
          <label key={room.value} className="flex items-center gap-2 text-sm">
            <Checkbox checked={roomTypes.includes(room.value)} onCheckedChange={(checked) => toggleType(room.value, checked === true)} />
            {room.label}
          </label>
        ))}
      </div>
      {roomTypes.map((roomType) => {
        const panel = rooms[roomType] ?? {};
        return (
          <div key={roomType} className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-medium capitalize">{roomType} room</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={control}
                name={`details.rooms.${roomType}.rent`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Expected rent per person</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`details.rooms.${roomType}.deposit`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Expected deposit per person</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PG_ROOM_AMENITIES.map((amenity) => {
                const selected = panel.amenities ?? [];
                return (
                  <label key={amenity} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selected.includes(amenity)}
                      onCheckedChange={(checked) => {
                        const amenities = checked ? [...selected, amenity] : selected.filter((item) => item !== amenity);
                        setValue(`details.rooms.${roomType}.amenities`, amenities, { shouldDirty: true });
                      }}
                    />
                    {amenity}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function stringValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}
