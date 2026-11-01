import type { ReactNode } from "react";
import { PublicChrome } from "./public-chrome";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicChrome>{children}</PublicChrome>;
}
