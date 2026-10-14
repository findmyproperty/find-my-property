"use client";

import type { ReactNode } from "react";

type PropertySectionProps = {
  title: string;
  id?: string;
  children: ReactNode;
  className?: string;
};

export function PropertySection({ title, id, children, className }: PropertySectionProps) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-border bg-card p-5 sm:p-6 ${className ?? ""}`}
    >
      <h2 className="mb-4 border-b-2 border-primary/30 pb-2 font-heading text-base font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
