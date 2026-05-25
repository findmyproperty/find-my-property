"use client";

import React, { createContext, useContext, useEffect } from "react";
import { api, type Settings } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { applyFavicon } from "@/lib/branding/client";
import { SITE_NAME } from "@/lib/branding";

interface SettingsContextType {
  settings: Settings | undefined;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["global-settings"],
    queryFn: api.getSettings,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.setAttribute("data-theme", settings.theme);
    }
  }, [settings?.theme]);

  useEffect(() => {
    applyFavicon(settings?.faviconUrl);
  }, [settings?.faviconUrl]);

  // Keep the browser tab label in sync with the admin-provided site name.
  // We only override when a siteName is configured — otherwise leave whatever
  // the page's `<title>` from Next metadata set.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const name = settings?.siteName?.trim();
    if (!name) return;
    // Preserve any per-page prefix from Next's title template (`Something | Site`).
    const current = document.title;
    const separatorIdx = current.lastIndexOf(" | ");
    if (separatorIdx > 0) {
      document.title = `${current.slice(0, separatorIdx)} | ${name}`;
    } else if (current === SITE_NAME || current.trim() === "") {
      document.title = name;
    }
  }, [settings?.siteName]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading }}>
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
