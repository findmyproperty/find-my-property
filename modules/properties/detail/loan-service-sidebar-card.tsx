"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERVICE_IMAGES } from "@/modules/services/service-images";

/** Compact loan CTA for property detail sidebar (and mobile stack). */
export function LoanServiceSidebarCard() {
  const { src, alt } = SERVICE_IMAGES.loans;

  return (
    <aside
      className="w-full shrink-0 self-stretch overflow-hidden rounded-2xl border border-border bg-card"
      aria-labelledby="loan-sidebar-title"
    >
      <div className="relative h-16 w-full bg-muted/40">
        <Image src={src} alt={alt} fill className="object-cover object-center" sizes="320px" />
        <div className="absolute inset-0 bg-linear-to-t from-card via-card/40 to-transparent" />
        <div className="absolute bottom-2 left-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/90 text-primary-foreground">
            <HandCoins className="size-4" aria-hidden />
          </span>
          <span className="rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Loan assistance
          </span>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div>
          <h3 id="loan-sidebar-title" className="font-heading text-sm font-semibold text-foreground">
            Finance this property
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Home loans, mortgage, and balance transfer — quick callback from our lending partners.
          </p>
        </div>
        <Button className="h-10 w-full gap-2 text-sm" size="sm" asChild>
          <Link href="/loans">
            Check loan options
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </aside>
  );
}
