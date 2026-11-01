"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";

type AuthLogoProps = {
  logoUrl?: string | null;
  siteName: string;
  className?: string;
  /** When set, logo navigates home (auth pages). */
  href?: string;
};

export function AuthLogo({ logoUrl, siteName, className = "", href }: AuthLogoProps) {
  const mark = (
    <div className={`flex h-24 w-40 items-center justify-center overflow-hidden ${className}`}>
      {logoUrl ? (
        <span className="relative inline-flex h-full w-full items-center justify-center overflow-hidden">
          <Image src={logoUrl} alt={siteName} fill sizes="160px" unoptimized className="object-contain" />
        </span>
      ) : (
        <div className="hero-gradient flex size-16 items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
          <Building2 className="size-8 text-primary-foreground" />
        </div>
      )}
    </div>
  );

  if (!href) return mark;

  return (
    <Link href={href} aria-label={`${siteName} home`} className="inline-flex transition-opacity hover:opacity-90">
      {mark}
    </Link>
  );
}
