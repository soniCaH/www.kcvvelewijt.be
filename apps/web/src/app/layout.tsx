import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AccentStrip } from "@/components/layout/AccentStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageFooter } from "@/components/layout/PageFooter";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { sanityClient } from "@/lib/sanity/client";
import {
  YOUTH_TEAMS_NAV_QUERY,
  type YouthTeamNavItem,
  SENIOR_TEAMS_NAV_QUERY,
  type SeniorTeamNavItem,
} from "@/lib/sanity/queries/teams";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    template: "%s | KCVV Elewijt",
    default: "KCVV Elewijt - Officiële Website",
  },
  description:
    "KCVV Elewijt voetbalclub met stamnummer 55 - Er is maar één plezante compagnie",
  keywords: ["KCVV Elewijt", "voetbal", "football", "Elewijt", "voetbalclub"],
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

// Phase 4: Mobile viewport configuration with safe area support
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // Enable safe area insets for modern mobile devices
  themeColor: BRAND.primaryColor,
};

/**
 * Render the application's root HTML layout, including the global header and footer, and conditionally load Adobe Typekit.
 *
 * Fetches youth team navigation items, sorts them by numeric age in descending order, and passes them to the header component.
 *
 * @param children - Page content to render between the header and footer
 * @returns The root JSX element containing the HTML, head, and body for the application
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const typekitId = process.env.NEXT_PUBLIC_TYPEKIT_ID;

  const [youthTeams, seniorTeams] = await Promise.all([
    sanityClient
      .fetch<
        YouthTeamNavItem[]
      >(YOUTH_TEAMS_NAV_QUERY, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as YouthTeamNavItem[]),
    sanityClient
      .fetch<
        SeniorTeamNavItem[]
      >(SENIOR_TEAMS_NAV_QUERY, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SeniorTeamNavItem[]),
  ]);

  const parseAge = (age: string) => parseInt(age.replace(/\D/g, "")) || 0;
  youthTeams.sort((a, b) => parseAge(b.age) - parseAge(a.age));

  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        {/* Adobe Typekit Fonts */}
        {typekitId && (
          <>
            <Script
              src={`https://use.typekit.net/${typekitId}.js`}
              strategy="beforeInteractive"
            />
            <Script id="typekit-init" strategy="beforeInteractive">
              {`try{Typekit.load({ async: true });}catch(e){console.error('Typekit load error:', e);}`}
            </Script>
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        <AccentStrip />
        <PageHeader youthTeams={youthTeams} seniorTeams={seniorTeams} />
        {children}
        <PageFooter />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
