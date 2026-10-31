"use client";

import { useCallback, useMemo, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGoogleMapsLoaderOptions } from "@/lib/google-maps-loader";
import { getThemeMarkerSymbol } from "@/lib/map-marker";

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }; // Bangalore

export interface LocationValue {
  lat: number;
  lng: number;
}

/** Parsed address from Geocoding API */
export interface AddressComponents {
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
}

/** Parse address_components from Geocoder result */
function parseAddressComponents(components: google.maps.GeocoderAddressComponent[]): AddressComponents {
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? "";
  const streetNumber = get("street_number");
  const route = get("route");
  const sublocality = get("sublocality_level_1") || get("sublocality");
  const locality = get("locality");
  const city = get("administrative_area_level_2") || locality;
  const state = get("administrative_area_level_1");
  const country = get("country");
  const address = [streetNumber, route].filter(Boolean).join(" ") || undefined;
  return {
    address: address || undefined,
    locality: locality || sublocality || undefined,
    city: city || undefined,
    state: state || undefined,
    country: country || undefined,
  };
}

/** Parse lat,lng from common Google Maps URL patterns */
function parseGoogleMapsUrl(url: string): LocationValue | null {
  const trimmed = url.trim();
  const patterns = [
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /\/maps\/place\/[^/@]*\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /\/maps\/search\/(-?\d+\.?\d*),\+?(-?\d+\.?\d*)/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (!match) continue;
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

async function resolveMapsLink(url: string): Promise<LocationValue | null> {
  const direct = parseGoogleMapsUrl(url);
  if (direct) return direct;
  try {
    const res = await fetch(`/api/expand-maps-link?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: number; lng?: number };
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      return { lat: data.lat, lng: data.lng };
    }
  } catch {
    /* ignore */
  }
  return null;
}

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 280,
  borderRadius: 12,
};

export interface LocationPickerProps {
  value: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  /** When location is set via map or link, optional callback with parsed address */
  onAddressChange?: (address: AddressComponents | null) => void;
  className?: string;
  height?: number;
  showLinkInput?: boolean;
}

const LocationPicker = ({
  value,
  onChange,
  onAddressChange,
  className,
  height = 320,
  showLinkInput = true,
}: LocationPickerProps) => {
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState(false);
  const [linkResolving, setLinkResolving] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader(getGoogleMapsLoaderOptions(apiKey));

  const mapCenter = useMemo(
    () => (value ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER),
    [value]
  );

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!window.google?.maps?.Geocoder) return;
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === "OK" && results?.[0]?.address_components) {
            onAddressChange?.(parseAddressComponents(results[0].address_components));
          } else {
            onAddressChange?.(null);
          }
        }
      );
    },
    [onAddressChange]
  );

  const setLocationAndGeocode = useCallback(
    (loc: LocationValue) => {
      onChange(loc);
      reverseGeocode(loc.lat, loc.lng);
    },
    [onChange, reverseGeocode]
  );

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        setLocationAndGeocode({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    },
    [setLocationAndGeocode]
  );

  const handleApplyLink = useCallback(async () => {
    setLinkResolving(true);
    setLinkError(false);
    try {
      const parsed = await resolveMapsLink(linkInput);
      if (parsed) {
        setLocationAndGeocode(parsed);
        setLinkInput("");
      } else {
        setLinkError(true);
      }
    } finally {
      setLinkResolving(false);
    }
  }, [linkInput, setLocationAndGeocode]);

  if (!apiKey) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-muted/30 flex items-center justify-center p-6 text-sm text-muted-foreground",
          className
        )}
        style={{ minHeight: height }}
      >
        Add NEXT_PUBLIC_GOOGLE_MAP_KEY to .env.local to enable the map.
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-destructive/10 text-destructive flex items-center justify-center p-6 text-sm",
          className
        )}
        style={{ minHeight: height }}
      >
        Failed to load map. Check your API key and network.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm",
          className
        )}
        style={{ minHeight: height }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showLinkInput && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-muted-foreground">
            <Link2 className="w-3.5 h-3.5" /> Paste Google Maps link (optional)
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.google.com/maps?q=12.97,77.59"
              value={linkInput}
              onChange={(e) => {
                setLinkInput(e.target.value);
                setLinkError(false);
              }}
              className={linkError ? "border-destructive" : ""}
            />
            <button
              type="button"
              onClick={() => void handleApplyLink()}
              disabled={linkResolving || !linkInput.trim()}
              className="px-3 py-2 rounded-md border border-border bg-muted hover:bg-muted/80 text-sm font-medium whitespace-nowrap disabled:opacity-50"
            >
              {linkResolving ? "Reading…" : "Apply"}
            </button>
          </div>
          {linkError && (
            <p className="text-xs text-destructive">
              Could not read coordinates from this link. Try a full Google Maps URL, or pin the
              location on the map below.
            </p>
          )}
        </div>
      )}
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height, minHeight: height }}
          center={mapCenter}
          zoom={value ? 15 : 10}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
            clickableIcons: false,
          }}
        >
          {value && (
            <Marker
              position={{ lat: value.lat, lng: value.lng }}
              icon={getThemeMarkerSymbol({ scale: 1.3 })}
            />
          )}
        </GoogleMap>
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur text-xs text-muted-foreground px-2 py-1 rounded flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {value ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : "Click on map to set location"}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
