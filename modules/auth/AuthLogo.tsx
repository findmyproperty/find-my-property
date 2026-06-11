"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";

type AuthLogoProps = {
  logoUrl?: string | null;
  siteName: string;
  className?: string;
};

export function AuthLogo({ logoUrl, siteName, className = "" }: AuthLogoProps) {
  return (
    <div
      className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-primary/20 ${className}`}
    >
      {logoUrl ? (
        <span className="relative inline-flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-muted">
          <Image src={logoUrl} alt={siteName} fill sizes="56px" unoptimized className="object-contain" />
        </span>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-linear-to-tr from-primary to-primary-foreground/90">
          <Building2 className="h-7 w-7 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
