"use client";

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
        <Navbar />
        {children}
        <Footer />
      </div>
    </ServiceAuthModalProvider>
  );
}
