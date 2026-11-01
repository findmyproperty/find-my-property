"use client";

import { Suspense, type ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ServiceAuthModalProvider } from "@/contexts/service-auth-modal-context";

/** Client chrome for marketing pages — keeps `app/(public)/layout.tsx` a Server Component. */
export function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <ServiceAuthModalProvider>
      <div className="min-h-screen overflow-x-hidden bg-background">
        <Suspense fallback={<div className="h-16 md:h-18" />}>
          <Navbar />
        </Suspense>
        {children}
        <Footer />
      </div>
    </ServiceAuthModalProvider>
  );
}
