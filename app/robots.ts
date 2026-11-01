import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/login",
        "/register",
        "/register-vendor",
        "/forgot-password",
        "/verify-agent",
        "/onboarding",
        "/logout",
        "/dashboard",
        "/profile",
        "/settings",
        "/listings",
        "/favorites",
        "/leads",
        "/reports",
        "/analytics",
        "/alerts",
        "/approvals",
        "/agents",
        "/properties",
        "/wallet",
        "/support",
        "/my-requests",
        "/add-property",
        "/edit-property",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
