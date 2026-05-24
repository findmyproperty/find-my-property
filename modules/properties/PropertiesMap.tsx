"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGoogleMapsLoaderOptions } from "@/lib/google-maps-loader";
import { getMarkerPosition, MAP_DEFAULT_CENTER } from "@/lib/property-map-coords";
import { getThemeMarkerSymbol } from "@/lib/map-marker";
import { isPointInBounds, type GeoPoint } from "@/lib/geo";
import type { Property } from "@/components/property/PropertyCard";

const DEFAULT_ZOOM = 11;
const USER_ZOOM = 12;

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 400,
  borderRadius: 12,
};

export interface PropertiesMapProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
  onVisibleCountChange?: (count: number) => void;
  className?: string;
  height?: number;
  /** When set, map opens centred on the user and only draws markers in the current viewport. */
  userCenter?: GeoPoint | null;
}

const PropertiesMap = ({
  properties,
  onPropertyClick,
  onVisibleCountChange,
  className,
  height = 480,
  userCenter = null,
}: PropertiesMapProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const idleListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const [zoom, setZoom] = useState(userCenter ? USER_ZOOM : DEFAULT_ZOOM);
  const [visibleProperties, setVisibleProperties] = useState<Property[]>(properties);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ?? "";
  const { isLoaded, loadError } = useJsApiLoader(getGoogleMapsLoaderOptions(apiKey));

  const positions = useMemo(
    () => properties.map((p) => ({ property: p, ...getMarkerPosition(p) })),
    [properties],
  );

  const approximateCount = positions.filter((x) => x.approximate).length;

  const syncVisibleToViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) {
      setVisibleProperties(properties);
      return;
    }
    const next = properties.filter((p) => {
      const { lat, lng } = getMarkerPosition(p);
      return isPointInBounds({ lat, lng }, bounds);
    });
    setVisibleProperties(next);
    onVisibleCountChange?.(next.length);
  }, [properties, onVisibleCountChange]);

  const fitAllProperties = useCallback(() => {
    if (positions.length === 0 || !mapRef.current) return;
    const bounds = new google.maps.LatLngBounds();
    positions.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    mapRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, [positions]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      idleListenerRef.current?.remove();
      idleListenerRef.current = map.addListener("idle", () => {
        syncVisibleToViewport();
        setZoom(map.getZoom() ?? DEFAULT_ZOOM);
      });

      if (userCenter) {
        map.setCenter(userCenter);
        map.setZoom(USER_ZOOM);
      } else if (positions.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        positions.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }

      window.setTimeout(() => syncVisibleToViewport(), 100);
    },
    [userCenter, positions, syncVisibleToViewport],
  );

  const onUnmount = useCallback(() => {
    idleListenerRef.current?.remove();
    idleListenerRef.current = null;
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      setVisibleProperties(properties);
      onVisibleCountChange?.(properties.length);
      return;
    }
    syncVisibleToViewport();
  }, [properties, syncVisibleToViewport, onVisibleCountChange]);

  const zoomIn = useCallback(() => {
    if (mapRef.current) {
      const z = mapRef.current.getZoom() ?? DEFAULT_ZOOM;
      mapRef.current.setZoom(Math.min(21, z + 1));
      setZoom(Math.min(21, z + 1));
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapRef.current) {
      const z = mapRef.current.getZoom() ?? DEFAULT_ZOOM;
      mapRef.current.setZoom(Math.max(1, z - 1));
      setZoom(Math.max(1, z - 1));
    }
  }, []);

  const mapMarkers = useMemo(() => {
    const source = userCenter ? visibleProperties : properties;
    return source.map((p) => ({ property: p, ...getMarkerPosition(p) }));
  }, [userCenter, visibleProperties, properties]);

  const initialCenter = userCenter ?? MAP_DEFAULT_CENTER;
  const initialZoom = userCenter ? USER_ZOOM : DEFAULT_ZOOM;

  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-muted/30 p-8 text-sm text-muted-foreground",
          className,
        )}
        style={{ height }}
      >
        Add NEXT_PUBLIC_GOOGLE_MAP_KEY to enable the map.
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-destructive/10 p-8 text-sm text-destructive",
          className,
        )}
        style={{ height }}
      >
        Failed to load map.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground",
          className,
        )}
        style={{ height }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {approximateCount > 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          {approximateCount} listing{approximateCount === 1 ? "" : "s"} use an approximate position (no saved map
          coordinates). Add a map pin when listing a property for exact placement.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          Zoom: {zoom} |{" "}
          {userCenter
            ? `${mapMarkers.length} in view · ${properties.length} total`
            : `${mapMarkers.length} propert${mapMarkers.length === 1 ? "y" : "ies"} on map`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fitAllProperties}
            disabled={positions.length === 0}
          >
            <Maximize2 className="mr-1 h-4 w-4" /> Fit all
          </Button>
          <div className="flex overflow-hidden rounded-lg border border-border">
            <Button type="button" variant="ghost" size="icon" className="rounded-none" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-none border-l border-border"
              onClick={zoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-border" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height, minHeight: height }}
          center={initialCenter}
          zoom={initialZoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: false,
          }}
        >
          {mapMarkers.map(({ property: p, lat, lng, approximate }) => {
            const label =
              p.priceValue >= 10000000
                ? `₹${(p.priceValue / 10000000).toFixed(1)}Cr`
                : p.priceValue >= 1000
                  ? `₹${(p.priceValue / 1000).toFixed(0)}K`
                  : `₹${p.priceValue}`;
            return (
              <Marker
                key={p.id}
                position={{ lat, lng }}
                icon={getThemeMarkerSymbol({ scale: 1.3, withLabel: true })}
                label={{
                  text: label.length > 8 ? `${label.slice(0, 7)}…` : label,
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
                title={approximate ? `${p.title} (approximate)` : p.title}
                onClick={() => onPropertyClick?.(p)}
                cursor="pointer"
                opacity={approximate ? 0.92 : 1}
              />
            );
          })}
        </GoogleMap>
      </div>
    </div>
  );
};

export default PropertiesMap;
