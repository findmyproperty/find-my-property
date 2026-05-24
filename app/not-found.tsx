import type { Metadata } from "next";
import NotFound from "@/modules/public/NotFound";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return <NotFound />;
}
