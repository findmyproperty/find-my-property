"use client";

import React, { createContext, useContext, useEffect } from "react";
import { api, type Settings } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { applyFavicon } from "@/lib/branding/client";
import { SITE_NAME, type PublicBranding } from "@/lib/branding";

interface SettingsContextType {
  settings: Partial<Settings> | undefined;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({
  children,
  initialBranding,
}: {
  children: React.ReactNode;
  initialBranding?: PublicBranding;
}) => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["global-settings"],
    queryFn: api.getSettings,
    staleTime: 10 * 60 * 1000,
    // Branding is already SSR'd — don't block first paint waiting on settings.
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  // Lock brand name to the compile-time constant even if the API still returns
  // a settings.siteName value from an older admin edit.
  const effectiveSettings: Partial<Settings> | undefined = settings
    ? { ...settings, siteName: SITE_NAME }
    : initialBranding
      ? { ...initialBranding, siteName: SITE_NAME }
      : undefined;

  useEffect(() => {
    if (effectiveSettings?.theme) {
      document.documentElement.setAttribute("data-theme", effectiveSettings.theme);
    }
  }, [effectiveSettings?.theme]);

  useEffect(() => {
    applyFavicon(effectiveSettings?.faviconUrl);
  }, [effectiveSettings?.faviconUrl]);

  // Keep the browser tab label in sync with the locked site name.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const current = document.title;
    const separatorIdx = current.lastIndexOf(" | ");
    if (separatorIdx > 0) {
      document.title = `${current.slice(0, separatorIdx)} | ${SITE_NAME}`;
    } else if (current.trim() === "") {
      document.title = SITE_NAME;
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings: effectiveSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
