"use client";

import { useEffect, useRef } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

import { getGoogleMapsLoaderOptions } from "@/lib/google-maps-loader";
import { cn } from "@/lib/utils";

import "./place-autocomplete-field.css";

export type PlaceAutocompleteSelection = {
  label: string;
  lat?: number;
  lng?: number;
  placeId?: string;
};

export type PlaceAutocompleteFieldProps = {
  placeholder?: string;
  /** Controlled text shown in the widget input. */
  value?: string;
  onTextChange?: (text: string) => void;
  onPlaceSelect?: (place: PlaceAutocompleteSelection) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
  countryCodes?: string[];
  noClearButton?: boolean;
  noInputIcon?: boolean;
};

type PlaceAutocompleteElementLike = HTMLElement & {
  value: string;
  placeholder: string;
  disabled: boolean;
  name?: string;
  includedRegionCodes?: string[];
  noClearButton?: boolean;
  noInputIcon?: boolean;
};

type PlacesLibraryWithAutocomplete = {
  PlaceAutocompleteElement: new (
    options?: Record<string, unknown>,
  ) => PlaceAutocompleteElementLike;
};

function latLngLiteral(location: unknown): { lat: number; lng: number } | null {
  if (!location || typeof location !== "object") return null;
  const loc = location as {
    lat?: number | (() => number);
    lng?: number | (() => number);
  };
  const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
  const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Modern Places Autocomplete widget (`PlaceAutocompleteElement`).
 * Mounted programmatically so `gmp-select` listeners work reliably under React.
 */
export function PlaceAutocompleteField({
  placeholder = "Search location…",
  value,
  onTextChange,
  onPlaceSelect,
  disabled = false,
  className,
  id,
  name,
  ariaLabel,
  countryCodes = ["in"],
  noClearButton = false,
  noInputIcon = false,
}: PlaceAutocompleteFieldProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader(
    getGoogleMapsLoaderOptions(apiKey),
  );
  const hostRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef<PlaceAutocompleteElementLike | null>(null);
  const onTextChangeRef = useRef(onTextChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);

  useEffect(() => {
    onTextChangeRef.current = onTextChange;
  }, [onTextChange]);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  useEffect(() => {
    if (!apiKey || !isLoaded || !hostRef.current) return;
    let cancelled = false;
    const host = hostRef.current;

    const mount = async () => {
      const placesLibrary = (await google.maps.importLibrary(
        "places",
      )) as unknown as PlacesLibraryWithAutocomplete;

      if (cancelled || !host.isConnected) return;
      if (typeof placesLibrary.PlaceAutocompleteElement !== "function") {
        console.error(
          "PlaceAutocompleteElement is unavailable. Enable Places API (New) for this key.",
        );
        return;
      }

      host.replaceChildren();
      const element = new placesLibrary.PlaceAutocompleteElement({
        includedRegionCodes: countryCodes,
        placeholder,
        requestedRegion: countryCodes[0],
      });

      if (id) element.id = id;
      if (name) element.name = name;
      if (ariaLabel) element.setAttribute("aria-label", ariaLabel);
      element.disabled = disabled;
      element.noClearButton = noClearButton;
      element.noInputIcon = noInputIcon;
      if (value != null) element.value = value;

      const handleSelect = (event: Event) => {
        const prediction = (
          event as Event & {
            placePrediction?: {
              toPlace: () => {
                fetchFields: (opts: { fields: string[] }) => Promise<void>;
                displayName?: string | null;
                formattedAddress?: string | null;
                id?: string | null;
                location?: unknown;
              };
            };
          }
        ).placePrediction;
        if (!prediction) return;

        void (async () => {
          const place = prediction.toPlace();
          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "location", "id"],
          });
          const coords = latLngLiteral(place.location);
          const label =
            place.formattedAddress ||
            place.displayName ||
            element.value ||
            "";
          if (!label) return;
          element.value = label;
          onTextChangeRef.current?.(label);
          onPlaceSelectRef.current?.({
            label,
            placeId: place.id ?? undefined,
            lat: coords?.lat,
            lng: coords?.lng,
          });
        })().catch((err: unknown) => {
          console.error("PlaceAutocompleteField selection failed", err);
        });
      };

      const handleInput = () => {
        onTextChangeRef.current?.(element.value ?? "");
      };

      element.addEventListener("gmp-select", handleSelect);
      element.addEventListener("input", handleInput);
      host.appendChild(element);
      elementRef.current = element;

      return () => {
        element.removeEventListener("gmp-select", handleSelect);
        element.removeEventListener("input", handleInput);
      };
    };

    let detach: (() => void) | undefined;
    void mount().then((cleanup) => {
      detach = cleanup;
    });

    return () => {
      cancelled = true;
      detach?.();
      elementRef.current = null;
      host.replaceChildren();
    };
    // Intentionally omit `value` — synced in a separate effect to avoid remount churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    apiKey,
    ariaLabel,
    countryCodes.join(","),
    disabled,
    id,
    isLoaded,
    name,
    noClearButton,
    noInputIcon,
    placeholder,
  ]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || value == null) return;
    if (el.value !== value) el.value = value;
  }, [value]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    el.disabled = disabled;
  }, [disabled]);

  if (!apiKey) {
    return (
      <div className={cn("ybdc-place-autocomplete", className)}>
        <input
          disabled
          placeholder="Add NEXT_PUBLIC_GOOGLE_MAP_KEY to enable search"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn("ybdc-place-autocomplete", className)}>
        <input
          disabled
          placeholder="Maps failed to load"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className={cn("ybdc-place-autocomplete", className)}
      data-loading={!isLoaded ? "true" : undefined}
    />
  );
}
