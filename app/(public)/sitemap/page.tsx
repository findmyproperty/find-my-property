import type { Metadata } from "next";
import Sitemap from "@/modules/public/Sitemap";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Browse public pages on Find My Property — listings, services, and account links.",
  alternates: { canonical: "/sitemap" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <Sitemap />;
}
