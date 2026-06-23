"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Closes a mobile nav drawer when the route changes (must render inside Suspense). */
export function MobileNavAutoClose({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;
    onClose();
  }, [pathname, onClose]);

  return null;
}
