"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationPicker, { type LocationValue, type AddressComponents } from "@/modules/properties/LocationPicker";
import type { PropertyFormValues } from "./schema";
import { useToast } from "@/hooks/use-toast";
import { useDetectCurrentLocation } from "@/hooks/use-detect-current-location";

export const LocationSection = () => {
  const { control, setValue } = useFormContext<PropertyFormValues>();
  const { toast } = useToast();
  const { run: detectLocation, isPending: detectingLocation } = useDetectCurrentLocation();
  const [mapLocation, setMapLocation] = useState<LocationValue | null>(null);

  const watchedLat = useWatch({ control, name: "latitude" });
  const watchedLng = useWatch({ control, name: "longitude" });

  const syncCoordsToForm = useCallback(
    (loc: LocationValue | null) => {
      if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
        setValue("latitude", loc.lat, { shouldValidate: true, shouldDirty: true });
        setValue("longitude", loc.lng, { shouldValidate: true, shouldDirty: true });
      } else {
        setValue("latitude", undefined, { shouldValidate: true });
        setValue("longitude", undefined, { shouldValidate: true });
      }
    },
    [setValue],
  );

  const handleMapChange = useCallback(
    (loc: LocationValue | null) => {
      setMapLocation(loc);
      syncCoordsToForm(loc);
    },
    [syncCoordsToForm],
  );

  useEffect(() => {
    if (
      watchedLat != null &&
      watchedLng != null &&
      Number.isFinite(watchedLat) &&
      Number.isFinite(watchedLng)
    ) {
      setMapLocation({ lat: watchedLat, lng: watchedLng });
    }
  }, [watchedLat, watchedLng]);

  const applyAddressComponents = useCallback(
    (addr: AddressComponents | null) => {
      if (!addr) return;
      if (addr.address != null) setValue("address", addr.address, { shouldValidate: true, shouldDirty: true });
      if (addr.locality != null) setValue("locality", addr.locality, { shouldValidate: true, shouldDirty: true });
      if (addr.city != null) setValue("city", addr.city, { shouldValidate: true, shouldDirty: true });
      if (addr.state != null) setValue("state", addr.state, { shouldValidate: true, shouldDirty: true });
      if (addr.country != null) setValue("country", addr.country, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const handleAddressFromMap = applyAddressComponents;

  const handleDetectLocation = useCallback(async () => {
    const outcome = await detectLocation();

    if (outcome.status === "success") {
      const { lat, lng, structured } = outcome.data;
      handleMapChange({ lat, lng });
      applyAddressComponents(structured);
      toast({
        variant: "success",
        title: "Location detected",
        description: "Fields filled from your current position. Adjust if needed.",
      });
      return;
    }

    if (outcome.status === "partial") {
      handleMapChange({ lat: outcome.lat, lng: outcome.lng });
      toast({
        title: "Address lookup incomplete",
        description: "Coordinates saved on the map. Enter street and city manually if fields are empty.",
      });
      return;
    }

    if (outcome.status === "unsupported") {
      toast({
        title: "Location unavailable",
        description: "Geolocation is not supported on this device. Please enter the address manually.",
        variant: "destructive",
      });
      return;
    }

    if (outcome.status === "denied") {
      toast({
        title: "Location permission denied",
        description: "Please enter your property location manually.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Could not get location",
      description: outcome.message || "Try again or enter your address manually.",
      variant: "destructive",
    });
  }, [applyAddressComponents, detectLocation, handleMapChange, toast]);

  return (
    <div className="space-y-4 pb-2">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDetectLocation}
            disabled={detectingLocation}
          >
            <LocateFixed className="mr-2 h-4 w-4" />
            {detectingLocation ? "Detecting…" : "Use current location"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Uses your device location and OpenStreetMap to fill the fields below. The map pin updates automatically.
          </span>
        </div>

        <FormField
          control={control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Address / Street</FormLabel>
              <FormControl>
                <Input placeholder="Building name, street, landmark" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="locality"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Locality / Area</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Whitefield" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>City</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Bengaluru" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Karnataka" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Country</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. India" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <FormLabel>Pin your property on map</FormLabel>
          <LocationPicker
            value={mapLocation}
            onChange={handleMapChange}
            onAddressChange={handleAddressFromMap}
            height={320}
            showLinkInput
          />
          {mapLocation && (
            <p className="mt-2 text-xs text-muted-foreground">
              Location set. We’ll use this pin and your address fields for search; otherwise we’ll use locality.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
