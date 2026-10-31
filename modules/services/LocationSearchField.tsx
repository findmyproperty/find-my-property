"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { PlaceAutocompleteField } from "@/components/maps/PlaceAutocompleteField";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getGoogleMapsServicesLoaderOptions } from "@/lib/google-maps-loader";
import { getThemeMarkerSymbol } from "@/lib/map-marker";

export interface LocationValue {
  label: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface LocationSearchFieldProps {
  value: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showMapPreview?: boolean;
  mapPreviewHeight?: number;
  error?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
  /** Allow committing a typed address without picking a Places suggestion (events). */
  allowFreeText?: boolean;
}

/**
 * PlaceAutocompleteElement-backed location input used across the service-request forms.
 *
 * Why a single component: Packers & Movers needs many instances (pickup + N drops),
 * Painting & Cleaning needs exactly one. Centralising the Google Maps loader access,
 * place selection, and current-location handling avoids per-page wiring.
 */
export default function LocationSearchField({
  value,
  onChange,
  placeholder = "Search for an address or area…",
  disabled,
  showMapPreview = false,
  mapPreviewHeight = 160,
  error,
  id,
  ariaLabel,
  className,
  allowFreeText = false,
}: LocationSearchFieldProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader(
    getGoogleMapsServicesLoaderOptions(apiKey),
  );

  const [text, setText] = useState(value?.label ?? "");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setText(value?.label ?? "");
  }, [value?.label]);

  // Free-text commit (events forms): debounce so we don't push on every keystroke.
  useEffect(() => {
    if (!allowFreeText) return;
    const trimmed = text.trim();
    if (trimmed.length < 10) return;
    if (value?.label === trimmed) return;
    const timer = window.setTimeout(() => {
      onChange({
        label: trimmed,
        lat: value?.lat && value.lng ? value.lat : 0,
        lng: value?.lat && value.lng ? value.lng : 0,
        placeId: value?.placeId,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [allowFreeText, onChange, text, value]);

  const handleTextChange = useCallback((next: string) => {
    setText(next);
  }, []);

  const handlePlaceSelect = useCallback(
    (place: {
      label: string;
      lat?: number;
      lng?: number;
      placeId?: string;
    }) => {
      if (
        place.lat == null ||
        place.lng == null ||
        !Number.isFinite(place.lat) ||
        !Number.isFinite(place.lng)
      ) {
        setText(place.label);
        if (allowFreeText) {
          onChange({
            label: place.label,
            lat: 0,
            lng: 0,
            placeId: place.placeId,
          });
        }
        return;
      }
      setText(place.label);
      onChange({
        label: place.label,
        lat: place.lat,
        lng: place.lng,
        placeId: place.placeId,
      });
    },
    [allowFreeText, onChange],
  );

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (!window.google?.maps?.Geocoder) {
          onChange({ label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
          setLocating(false);
          return;
        }
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          const label =
            status === "OK" && results?.[0]?.formatted_address
              ? results[0].formatted_address
              : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onChange({
            label,
            lat,
            lng,
            placeId: results?.[0]?.place_id,
          });
          setLocating(false);
        });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [onChange]);

  const clear = useCallback(() => {
    onChange(null);
    setText("");
  }, [onChange]);

  const markerPosition = useMemo(() => {
    if (!value) return null;
    if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return null;
    if (value.lat === 0 && value.lng === 0) return null;
    return { lat: value.lat, lng: value.lng };
  }, [value]);

  if (!apiKey) {
    return (
      <Input
        value={text}
        disabled
        placeholder="Add NEXT_PUBLIC_GOOGLE_MAP_KEY to enable search"
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <PlaceAutocompleteField
          id={id}
          ariaLabel={ariaLabel}
          value={text}
          onTextChange={handleTextChange}
          onPlaceSelect={handlePlaceSelect}
          placeholder={
            loadError
              ? "Maps failed to load"
              : isLoaded
                ? placeholder
                : "Loading search…"
          }
          disabled={disabled || !isLoaded}
          noInputIcon
          className={cn(
            "h-10 rounded-md border border-input bg-background pr-20 text-sm",
            error && "border-destructive",
          )}
        />

        <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              aria-label="Clear location"
              className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={disabled || !isLoaded || locating}
            aria-label="Use my current location"
            className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <LocateFixed className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {showMapPreview && isLoaded && markerPosition ? (
        <div
          className="overflow-hidden rounded-lg border border-border"
          style={{ height: mapPreviewHeight }}
        >
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={markerPosition}
            zoom={15}
            options={{
              disableDefaultUI: true,
              clickableIcons: false,
              gestureHandling: "cooperative",
            }}
          >
            <Marker
              position={markerPosition}
              icon={getThemeMarkerSymbol({ scale: 1.2 })}
            />
          </GoogleMap>
          <div className="flex items-center gap-1.5 border-t border-border bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden />
            <span className="truncate">{value?.label}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
