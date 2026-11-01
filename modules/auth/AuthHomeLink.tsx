"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AuthHomeLinkProps = {
  className?: string;
};

/** Back-to-home escape hatch for full-page auth screens. */
export function AuthHomeLink({ className = "mt-6" }: AuthHomeLinkProps) {
  return (
    <div className={`text-center ${className}`}>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to home
      </Link>
    </div>
  );
}
