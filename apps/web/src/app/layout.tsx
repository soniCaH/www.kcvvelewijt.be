import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageFooter } from "@/components/layout/PageFooter";
import { sanityClient } from "@/lib/sanity/client";
import {
  YOUTH_TEAMS_NAV_QUERY,
  type YouthTeamNavItem,
} from "@/lib/sanity/queries/teams";

export const metadata: Metadata = {
  title: {
    template: "%s | KCVV Elewijt",
    default: "KCVV Elewijt - Officiële Website",
  },
  description:
    "KCVV Elewijt voetbalclub met stamnummer 55 - Er is maar één plezante compagnie",
  keywords: ["KCVV Elewijt", "voetbal", "football", "Elewijt", "voetbalclub"],
};

// Phase 4: Mobile viewport configuration with safe area support
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // Enable safe area insets for modern mobile devices
};

/**
 * Root layout that wraps pages with HTML structure, loads Adobe Typekit, and renders the global header and footer.
 *
 * @param children - The page content to render between the header and footer.
 * @returns The root JSX element for the application layout.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const typekitId = process.env.NEXT_PUBLIC_TYPEKIT_ID;

  const youthTeams = await sanityClient
    .fetch<
      YouthTeamNavItem[]
    >(YOUTH_TEAMS_NAV_QUERY, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as YouthTeamNavItem[]);

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
        <PageHeader youthTeams={youthTeams} />
        {children}
        <PageFooter />
      </body>
    </html>
  );
}
