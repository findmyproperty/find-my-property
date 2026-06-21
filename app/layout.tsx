import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { AppProviders } from "@/contexts/app-providers";
import { cn } from "@/lib/utils";
import { DEFAULT_FAVICON_URL } from "@/lib/branding";
import { getBranding } from "@/lib/branding/server";
import { metadataBase } from "@/lib/seo/site";

const SITE_DESCRIPTION =
  "Find verified rental and sale listings in India. Browse by city and budget, contact owners directly — without broker commission.";

export async function generateMetadata(): Promise<Metadata> {
  "use cache";
  const { siteName, faviconUrl } = await getBranding();
  const iconUrl = faviconUrl || DEFAULT_FAVICON_URL;

  return {
    metadataBase: metadataBase(),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: siteName,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName,
      title: siteName,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: SITE_DESCRIPTION,
    },
    robots: { index: true, follow: true },
    icons: { icon: iconUrl, shortcut: iconUrl, apple: iconUrl },
  };
}

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const fontHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getBranding();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "antialiased",
          fontSans.variable,
          fontHeading.variable,
          "font-[family-name:var(--font-body)]",
        )}
      >
        <AppProviders initialBranding={branding}>{children}</AppProviders>
      </body>
    </html>
  );
}
