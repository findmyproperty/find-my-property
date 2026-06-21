"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Closes a mobile nav drawer when the route changes (must render inside Suspense). */
export function MobileNavAutoClose({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return null;
}