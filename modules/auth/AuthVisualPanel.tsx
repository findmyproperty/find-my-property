"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type AuthVisualPanelProps = {
  siteName: string;
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthVisualPanel({ siteName, eyebrow, title, description }: AuthVisualPanelProps) {
  return (
    <div className="relative hidden overflow-hidden bg-foreground lg:flex lg:w-1/2">
      <Image
        src="/images/hero-bg.jpg"
        alt="Modern residential property at sunset"
        fill
        priority
        className="object-cover"
        sizes="(max-width: 1023px) 0px, 50vw"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/10" />
      <div className="absolute inset-0 bg-linear-to-r from-black/35 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 flex h-full w-full flex-col justify-end p-10 xl:p-12"
      >
        <div className="max-w-xl rounded-lg border border-white/20 bg-black/35 p-6 text-white shadow-2xl backdrop-blur-md">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{eyebrow}</p>
          <h1 className="font-heading text-4xl font-bold leading-tight xl:text-5xl">{title}</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/78">{description}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/15 bg-white/10 p-3">
              <p className="font-heading text-lg font-bold">1,200+</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/60">Families</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-3">
              <p className="font-heading text-lg font-bold">Verified</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/60">Listings</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-3">
              <p className="font-heading text-lg font-bold">Local</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/60">{siteName}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
