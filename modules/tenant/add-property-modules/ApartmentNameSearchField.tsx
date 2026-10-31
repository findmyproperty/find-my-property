"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useJsApiLoader } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MIN_APARTMENT_PLACE_QUERY_LENGTH,
  type ApartmentPlaceDetail,
  type ApartmentPlaceSuggestion,
} from "@/lib/apartment-places";
import { getListingCityGeo } from "@/lib/listing-city-geo";
import { getGoogleMapsLoaderOptions } from "@/lib/google-maps-loader";
import { isListingCity } from "@/lib/property-posting";

export type ApartmentNameSearchFieldProps = {
  value: string;
  onChange: (name: string) => void;
  city: string;
  /** Called after a suggestion is chosen and place details load (coords / address). */
  onPlaceSelected?: (detail: ApartmentPlaceDetail) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  className?: string;
};

type SearchResponse = {
  suggestions?: ApartmentPlaceSuggestion[];
  clientFallback?: boolean;
  error?: string;
};
type DetailResponse = {
  detail?: ApartmentPlaceDetail;
  clientFallback?: boolean;
  error?: string;
};

/**
 * Debounced apartment / society name search scoped to listing city.
 * Prefers cached `/api/apartment-places` when `GOOGLE_MAPS_SERVER_KEY` is set;
 * otherwise uses browser Places AutocompleteService with `NEXT_PUBLIC_GOOGLE_MAP_KEY`
 * (referrer-restricted keys cannot call Places from the server).
 */
export function ApartmentNameSearchField({
  value,
  onChange,
  city,
  onPlaceSelected,
  placeholder = "Society or apartment name",
  disabled,
  id,
  className,
  ...rest
}: ApartmentNameSearchFieldProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ?? "";
  const { isLoaded } = useJsApiLoader(getGoogleMapsLoaderOptions(apiKey));

  const [text, setText] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ApartmentPlaceSuggestion[]>([]);
  const [highlight, setHighlight] = useState(0);
  const blurCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const placesAttrRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  const searchViaClientPlaces = useEffectEvent(
    (query: string, listingCity: string): Promise<ApartmentPlaceSuggestion[]> => {
      return new Promise((resolve) => {
        if (!window.google?.maps?.places || !isListingCity(listingCity)) {
          resolve([]);
          return;
        }
        const geo = getListingCityGeo(listingCity);
        if (!geo) {
          resolve([]);
          return;
        }

        const service = new google.maps.places.AutocompleteService();
        // Soft location/radius bias is not enough — "HSR" still ranks Bengaluru.
        // Use circle bounds + strictBounds so results must sit inside the selected city.
        const center = new google.maps.LatLng(geo.lat, geo.lng);
        const circle = new google.maps.Circle({
          center,
          radius: geo.radiusMeters,
        });
        const bounds = circle.getBounds();
        if (!bounds) {
          resolve([]);
          return;
        }

        const blockedCityTokens =
          listingCity === "Chennai"
            ? ["bengaluru", "bangalore", "bengalooru"]
            : ["chennai", "madras"];

        // `strictBounds` is supported by AutocompleteService at runtime but missing from current typings.
        const request = {
          input: query.trim(),
          componentRestrictions: { country: "in" },
          bounds,
          strictBounds: true,
          location: center,
          radius: geo.radiusMeters,
        } as google.maps.places.AutocompletionRequest;

        service.getPlacePredictions(request, (predictions, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !predictions?.length
          ) {
            resolve([]);
            return;
          }
          const filtered = predictions.filter((p) => {
            const haystack = `${p.description} ${p.structured_formatting?.secondary_text ?? ""}`.toLowerCase();
            return !blockedCityTokens.some((token) => haystack.includes(token));
          });
          resolve(
            filtered.slice(0, 8).map((p) => ({
              placeId: p.place_id,
              name: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text,
            })),
          );
        });
      });
    },
  );

  const runSearch = useEffectEvent(async (query: string, listingCity: string) => {
    abortRef.current?.abort();
    if (!isListingCity(listingCity) || query.trim().length < MIN_APARTMENT_PLACE_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        city: listingCity,
      });
      const res = await fetch(`/api/apartment-places?${params}`, {
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => ({}))) as SearchResponse;
      let next = data.suggestions ?? [];

      if (data.clientFallback || !res.ok || next.length === 0) {
        // Prefer client Places when server key is missing or Google returned nothing via API.
        // Only force client when fallback flagged or request failed; empty OK responses still try client.
        if (data.clientFallback || !res.ok) {
          next = await searchViaClientPlaces(query, listingCity);
        } else if (next.length === 0 && isLoaded) {
          next = await searchViaClientPlaces(query, listingCity);
        }
      }

      if (controller.signal.aborted) return;
      setSuggestions(next);
      setHighlight(0);
      if (next.length > 0) setOpen(true);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      try {
        const next = await searchViaClientPlaces(query, listingCity);
        setSuggestions(next);
        setHighlight(0);
        if (next.length > 0) setOpen(true);
      } catch {
        setSuggestions([]);
      }
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  });

  useEffect(() => {
    if (!isListingCity(city)) {
      setSuggestions([]);
      return;
    }
    const q = text.trim();
    if (q.length < MIN_APARTMENT_PLACE_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      void runSearch(q, city);
    }, 300);
    return () => clearTimeout(timer);
  }, [text, city, isLoaded]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (blurCloseTimer.current) clearTimeout(blurCloseTimer.current);
    };
  }, []);

  const fetchDetailViaClient = (placeId: string): Promise<ApartmentPlaceDetail | null> => {
    return new Promise((resolve) => {
      if (!window.google?.maps?.places || !placesAttrRef.current) {
        resolve(null);
        return;
      }
      const service = new google.maps.places.PlacesService(placesAttrRef.current);
      service.getDetails(
        {
          placeId,
          fields: ["place_id", "name", "formatted_address", "geometry", "address_component"],
        },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
            resolve(null);
            return;
          }
          const locality =
            place.address_components?.find((c) => c.types.includes("sublocality_level_1"))
              ?.long_name ||
            place.address_components?.find((c) => c.types.includes("sublocality"))?.long_name ||
            place.address_components?.find((c) => c.types.includes("neighborhood"))?.long_name ||
            place.address_components?.find((c) => c.types.includes("locality"))?.long_name;
          resolve({
            placeId: place.place_id ?? placeId,
            name: place.name ?? "",
            formattedAddress: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            locality,
          });
        },
      );
    });
  };

  const selectSuggestion = async (item: ApartmentPlaceSuggestion) => {
    onChange(item.name);
    setText(item.name);
    setOpen(false);
    setSuggestions([]);

    if (!onPlaceSelected) return;
    try {
      const params = new URLSearchParams({ placeId: item.placeId });
      const res = await fetch(`/api/apartment-places/detail?${params}`);
      const data = (await res.json().catch(() => ({}))) as DetailResponse;
      if (res.ok && data.detail) {
        onPlaceSelected(data.detail);
        return;
      }
      const detail = await fetchDetailViaClient(item.placeId);
      if (detail) onPlaceSelected(detail);
    } catch {
      const detail = await fetchDetailViaClient(item.placeId);
      if (detail) onPlaceSelected(detail);
    }
  };

  const commitFreeText = () => {
    const next = text.trim();
    if (next !== (value ?? "").trim()) onChange(next);
  };

  const showList = open && suggestions.length > 0 && !disabled;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Attribution / PlacesService mount node (required by Google Maps JS). */}
      <div ref={placesAttrRef} className="hidden" aria-hidden />
      <div className="relative">
        <Input
          id={id}
          value={text}
          disabled={disabled}
          placeholder={
            isListingCity(city) ? placeholder : "Select a city first"
          }
          aria-invalid={rest["aria-invalid"]}
          aria-autocomplete="list"
          aria-expanded={showList}
          role="combobox"
          autoComplete="off"
          className={cn("pr-9", rest["aria-invalid"] && "border-destructive")}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => {
            blurCloseTimer.current = setTimeout(() => {
              setOpen(false);
              commitFreeText();
            }, 150);
          }}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const item = suggestions[highlight];
              if (item) void selectSuggestion(item);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MapPin className="h-4 w-4 opacity-60" aria-hidden />
          )}
        </div>
      </div>

      {showList ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {suggestions.map((item, index) => (
            <li key={item.placeId} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                  index === highlight
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/60",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => void selectSuggestion(item)}
              >
                <span className="truncate font-medium">{item.name}</span>
                {item.secondaryText ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {item.secondaryText}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
