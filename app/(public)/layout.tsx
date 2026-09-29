"use client";

import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ServiceAuthModalProvider } from "@/contexts/service-auth-modal-context";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
