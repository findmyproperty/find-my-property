"use client";

import Link from "next/link";
import { Check, ChevronsUpDown, Loader2, MapPin, Star, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePublicVendorOptions } from "@/hooks/use-public-vendors";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/end-points/service-requests";
import type { PublicVendorOption } from "@/schema/vendor";

function vendorDisplayName(vendor: PublicVendorOption) {
  return vendor.businessName?.trim() || vendor.vendorName?.trim() || "Verified partner";
}

function vendorProfileHref(vendor: PublicVendorOption) {
  return `/vendors/${vendor.slug?.trim() || vendor.userId}`;
}

function initialsFor(vendor: PublicVendorOption) {
  return vendorDisplayName(vendor)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ratingLabel(vendor: PublicVendorOption) {
  if (!vendor.overallRating || vendor.reviewCount === 0) return "New";
  return `${vendor.overallRating.toFixed(1)} (${vendor.reviewCount})`;
}

function VendorOption({
  vendor,
  selected,
}: {
  vendor: PublicVendorOption;
  selected: boolean;
}) {
  const displayName = vendorDisplayName(vendor);
  const serviceAreas = vendor.serviceLocations?.slice(0, 3) ?? [];
  const categoryNames = vendor.categories.slice(0, 2).map((category) => category.name);

  return (
    <div className="flex min-w-0 flex-1 items-start gap-3 py-1">
      <Avatar className="size-11 border border-border">
        {vendor.photoUrl ? (
          <AvatarImage src={vendor.photoUrl} alt={displayName} />
        ) : null}
        <AvatarFallback className="text-xs font-semibold">
          {initialsFor(vendor)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={vendorProfileHref(vendor)}
              className="block truncate font-medium text-foreground hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {displayName}
            </Link>
            {vendor.vendorName ? (
              <p className="truncate text-xs text-muted-foreground">
                {vendor.vendorName}
              </p>
            ) : null}
          </div>
          <Check
            className={cn(
              "mt-0.5 size-4 shrink-0",
              selected ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="gap-1">
            <Star className="size-3 fill-current" aria-hidden />
            {ratingLabel(vendor)}
          </Badge>
          <Badge variant="outline">{vendor.completedJobsCount} jobs</Badge>
          {categoryNames.map((name) => (
            <Badge key={name} variant="outline">
              {name}
            </Badge>
          ))}
        </div>

        {serviceAreas.length > 0 ? (
          <p className="mt-2 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{serviceAreas.join(", ")}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function VendorSelector({
  serviceType,
  category,
  value,
  onValueChange,
  disabled,
}: {
  serviceType: ServiceType;
  category?: string | null;
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  const { data: vendors = [], isLoading, isError } = usePublicVendorOptions({
    serviceType,
    category,
  });
  const selected = vendors.find((vendor) => vendor.userId === value);
  const selectedLabel = selected ? vendorDisplayName(selected) : null;

  const isTriggerDisabled = disabled || !category;
  const triggerText = category
    ? (selectedLabel ?? "Choose a preferred vendor")
    : "Please select a service type first";

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={isTriggerDisabled}
            className={cn(
              "h-auto min-h-10 w-full justify-between px-3 py-2 font-normal",
              !selectedLabel && "text-muted-foreground",
            )}
          >
            <span className="min-w-0 truncate">
              {triggerText}
            </span>
            {isLoading ? (
              <Loader2 className="ml-2 size-4 shrink-0 animate-spin opacity-70" />
            ) : (
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command>
            <CommandInput placeholder="Search vendors..." />
            <CommandList>
              <CommandEmpty>
                {isError
                  ? "Could not load vendors."
                  : isLoading
                    ? "Loading vendors..."
                    : "No matching vendors found."}
              </CommandEmpty>
              <CommandGroup>
                {vendors.map((vendor) => (
                  <CommandItem
                    key={vendor.userId}
                    value={[
                      vendorDisplayName(vendor),
                      vendor.vendorName,
                      ...(vendor.serviceLocations ?? []),
                      ...vendor.categories.map((category) => category.name),
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onSelect={() => onValueChange(vendor.userId)}
                    className="items-start"
                  >
                    <VendorOption
                      vendor={vendor}
                      selected={vendor.userId === value}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit px-2 text-muted-foreground"
          onClick={() => onValueChange(null)}
        >
          <X className="mr-1 size-3" aria-hidden />
          Clear vendor
        </Button>
      ) : null}
    </div>
  );
}
