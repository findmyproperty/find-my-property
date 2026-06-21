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
  });
  const effectiveSettings: Partial<Settings> | undefined = settings ?? initialBranding;

  useEffect(() => {
    if (effectiveSettings?.theme) {
      document.documentElement.setAttribute("data-theme", effectiveSettings.theme);
    }
  }, [effectiveSettings?.theme]);

  useEffect(() => {
    applyFavicon(effectiveSettings?.faviconUrl);
  }, [effectiveSettings?.faviconUrl]);

  // Keep the browser tab label in sync with the admin-provided site name.
  // We only override when a siteName is configured — otherwise leave whatever
  // the page's `<title>` from Next metadata set.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const name = effectiveSettings?.siteName?.trim();
    if (!name) return;
    // Preserve any per-page prefix from Next's title template (`Something | Site`).
    const current = document.title;
    const separatorIdx = current.lastIndexOf(" | ");
    if (separatorIdx > 0) {
      document.title = `${current.slice(0, separatorIdx)} | ${name}`;
    } else if (current === SITE_NAME || current.trim() === "") {
      document.title = name;
    }
  }, [effectiveSettings?.siteName]);

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
