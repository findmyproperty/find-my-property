"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { getGoogleMapsLoaderOptions } from "@/lib/google-maps-loader";
import { getThemeMarkerSymbol } from "@/lib/map-marker";
import type { Property } from "@/components/property/PropertyCard";

// Coordinate mappings for major Indian metropolitan hubs
const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom?: number }> = {
  chennai: { lat: 13.0827, lng: 80.2707, zoom: 12 },
  bangalore: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  "bangalore division": { lat: 12.9716, lng: 77.5946, zoom: 12 },
  bengaluru: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  mumbai: { lat: 19.076, lng: 72.8777, zoom: 12 },
  delhi: { lat: 28.7041, lng: 77.1025, zoom: 12 },
  "new delhi": { lat: 28.6139, lng: 77.209, zoom: 12 },
  hyderabad: { lat: 17.385, lng: 78.4867, zoom: 12 },
  pune: { lat: 18.5204, lng: 73.8567, zoom: 12 },
  kochi: { lat: 9.9312, lng: 76.2673, zoom: 12 },
  kolkata: { lat: 22.5726, lng: 88.3639, zoom: 12 },
  ahmedabad: { lat: 23.0225, lng: 72.5714, zoom: 12 },
  noida: { lat: 28.5355, lng: 77.391, zoom: 12 },
  gurgaon: { lat: 28.4595, lng: 77.0266, zoom: 12 },
  gurugram: { lat: 28.4595, lng: 77.0266, zoom: 12 },
};

const INDIA_CENTER = { lat: 15.3173, lng: 78.7139 }; // Center overview

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#121316" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#121316" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b8d98" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e1e3ec" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#636674" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1b1d22" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#4f5260" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#22242a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#121316" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#636674" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2e313a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#121316" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b5b7c4" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1d1f25" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#636674" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0a0c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3a3c48" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0c" }] },
];

const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f8f9fa" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5f6368" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f8f9fa" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#202124" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f1f3f4" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#70757a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e8eaed" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#70757a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#70757a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e8eaed" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#dadce0" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#5f6368" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e8eaed" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#f1f3f4" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#60a5fa" }] },
];

import type { PopularCity } from "@/lib/property-location-options";

export interface LocalityHubsSectionProps {
  popularCities: PopularCity[];
  allProperties?: Property[];
}

export function LocalityHubsSection({
  popularCities,
}: LocalityHubsSectionProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ?? "";
  const { isLoaded: isMapLoaded } = useJsApiLoader(getGoogleMapsLoaderOptions(apiKey));

  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeCityName, setActiveCityName] = useState<string | null>(null);

  // Markers from popular cities and properties
  const cityMarkers = useMemo(() => {
    return popularCities
      .map((c) => {
        const cityName = c.name;
        const key = cityName.toLowerCase().trim();
        const coords = CITY_COORDINATES[key];
        if (!coords) return null;
        return {
          city: cityName,
          count: c.count,
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [popularCities]);

  const mapCenter = useMemo(() => {
    if (activeCityName) {
      const key = activeCityName.toLowerCase().trim();
      const coords = CITY_COORDINATES[key];
      if (coords) return { lat: coords.lat, lng: coords.lng };
    }
    if (cityMarkers.length > 0) {
      return { lat: cityMarkers[0].lat, lng: cityMarkers[0].lng };
    }
    return INDIA_CENTER;
  }, [activeCityName, cityMarkers]);

  const handleCityHover = useCallback((cityName: string) => {
    setActiveCityName(cityName);
    const key = cityName.toLowerCase().trim();
    const coords = CITY_COORDINATES[key];
    if (coords && mapRef.current) {
      mapRef.current.panTo({ lat: coords.lat, lng: coords.lng });
      mapRef.current.setZoom(coords.zoom ?? 12);
    }
  }, []);

  const handleCityLeave = useCallback(() => {
    setActiveCityName(null);
    if (mapRef.current && cityMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      cityMarkers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [cityMarkers]);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (cityMarkers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        cityMarkers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      }
    },
    [cityMarkers],
  );

  if (popularCities.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-b border-border/80 py-20 sm:py-28 bg-background">
      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>05 — Geographic Reach</span>
              <span className="text-border">•</span>
              <span>Metropolitan Portals</span>
            </div>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
              Active Markets &amp; Locality Hubs
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base leading-relaxed text-muted-foreground">
            Ranked by verified inventory and active partner coverage across key Indian metropolitan micro-markets.
          </p>
        </div>

        {/* Master Locality Showcase: Map + Hub Cards */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Locality Cards List */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {popularCities.map((city) => {
                const isActive = activeCityName === city.name;
                return (
                  <Link
                    key={city.name}
                    href={`/browse?loc=${encodeURIComponent(city.name)}`}
                    onMouseEnter={() => handleCityHover(city.name)}
                    onMouseLeave={handleCityLeave}
                    className={cn(
                      "group flex items-center justify-between rounded-2xl border p-4.5 transition-all duration-300 shadow-xs backdrop-blur-md",
                      isActive
                        ? "border-primary bg-primary/10 shadow-md scale-[1.01]"
                        : "border-border/70 bg-card/70 hover:border-primary/50 hover:bg-card/90",
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                        )}
                      >
                        <MapPin className="size-4" />
                      </div>
                      <div>
                        <span className="font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                          {city.name}
                        </span>
                        <span className="block text-xs text-muted-foreground font-mono">
                          {city.count} {city.count === 1 ? "Verified Property" : "Verified Properties"}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      className={cn(
                        "size-4 transition-transform text-muted-foreground group-hover:translate-x-1 group-hover:text-primary",
                        isActive && "translate-x-1 text-primary",
                      )}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Bottom Explore Link */}
            <div className="pt-2">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary hover:underline"
              >
                <span>Browse All Indian Metros</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: High-Tech Google Map Container */}
          <div className="lg:col-span-7 min-h-[380px] sm:min-h-[460px] relative rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-card">
            {apiKey && isMapLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%", minHeight: 380 }}
                center={mapCenter}
                zoom={11}
                onLoad={onMapLoad}
                options={{
                  styles: isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
                  disableDefaultUI: true,
                  zoomControl: true,
                  clickableIcons: false,
                  gestureHandling: "cooperative",
                }}
              >
                {cityMarkers.map((marker) => (
                  <Marker
                    key={marker.city}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    icon={getThemeMarkerSymbol({ scale: 1.4 })}
                    title={`${marker.city} (${marker.count} listings)`}
                    onClick={() => handleCityHover(marker.city)}
                  />
                ))}
              </GoogleMap>
            ) : (
              <div className="flex h-full min-h-[380px] items-center justify-center p-6 text-center text-sm text-muted-foreground bg-muted/30">
                <MapPin className="size-6 mr-2 text-primary animate-pulse" />
                <span>Active Metropolitan Portal Map</span>
              </div>
            )}

            {/* Floating Top-Right Map Status Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3.5 py-1.5 text-xs text-foreground backdrop-blur-md shadow-md">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono uppercase tracking-wider text-[11px]">
                {activeCityName ? `${activeCityName} Region` : "National Coverage"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
