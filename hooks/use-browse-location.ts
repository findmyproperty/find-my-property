"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { detectCurrentLocation } from "@/lib/detect-current-location";
import {
  isValidCoordinates,
  readSessionGps,
  toGeoPoint,
  writeSessionGps,
  type GeoPoint,
} from "@/lib/geo";

export type BrowseLocationSource = "gps" | "profile";

export type BrowseLocation = GeoPoint & {
  source: BrowseLocationSource;
  label?: string;
};

/**
 * Resolves browse centre: browser GPS (cached per session) → signed-in user profile coords.
 */
export function useBrowseLocation() {
  const { user, isAuthReady } = useAuth();
  const [location, setLocation] = useState<BrowseLocation | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    let cancelled = false;

    const finish = (next: BrowseLocation | null) => {
      if (cancelled) return;
      setLocation(next);
      setIsResolving(false);
    };

    async function resolve() {
      const cached = readSessionGps();
      if (cached) {
        finish({ ...cached, source: "gps" });
        return;
      }

      const outcome = await detectCurrentLocation();
      if (cancelled) return;

      if (outcome.status === "success") {
        const point = toGeoPoint(outcome.data.lat, outcome.data.lng);
        if (point) {
          writeSessionGps(point);
          finish({
            ...point,
            source: "gps",
            label:
              outcome.data.structured.city ||
              outcome.data.displayName ||
              undefined,
          });
          return;
        }
      }

      if (outcome.status === "partial") {
        const point = toGeoPoint(outcome.lat, outcome.lng);
        if (point) {
          writeSessionGps(point);
          finish({ ...point, source: "gps" });
          return;
        }
      }

      if (user && isValidCoordinates(user.latitude, user.longitude)) {
        finish({
          lat: Number(user.latitude),
          lng: Number(user.longitude),
          source: "profile",
          label: [user.locationCity, user.locationState].filter(Boolean).join(", ") || undefined,
        });
        return;
      }

      finish(null);
    }

    setIsResolving(true);
    void resolve();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthReady,
    user?.latitude,
    user?.longitude,
    user?.locationCity,
    user?.locationState,
  ]);

  return { location, isResolving };
}
