"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { SettingsProvider } from "@/contexts/settings-context";
import type { PublicBranding } from "@/lib/branding";
import { useState } from "react";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({
  children,
  initialBranding,
}: {
  children: React.ReactNode;
  initialBranding?: PublicBranding;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <SettingsProvider initialBranding={initialBranding}>
            <AuthProvider>
              <NuqsAdapter>
                <Toaster />
                <Sonner />
                {children}
              </NuqsAdapter>
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
