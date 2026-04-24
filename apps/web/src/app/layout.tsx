import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Montserrat, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AccentStrip } from "@/components/layout/AccentStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageFooter } from "@/components/layout/PageFooter";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { GoogleTagManagerLoader } from "@/components/layout/GoogleTagManagerLoader";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  TeamRepository,
  type TeamNavVM,
} from "@/lib/repositories/team.repository";
import { BRAND, SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-montserrat",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.siteUrl),
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
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
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

  let allTeams: TeamNavVM[] = [];
  try {
    allTeams = await runPromise(
      Effect.gen(function* () {
        const repo = yield* TeamRepository;
        return yield* repo.findAll();
      }),
    );
  } catch {
    allTeams = [];
  }

  const isYouthAge = (age: string | null): age is string =>
    age != null && age.startsWith("U");
  const seniorTeams = allTeams.filter((t) => !isYouthAge(t.age));
  const parseAge = (age: string) => parseInt(age.replace(/\D/g, "")) || 0;
  const youthTeams = allTeams
    .filter((t) => isYouthAge(t.age))
    .sort((a, b) => parseAge(b.age!) - parseAge(a.age!));

  return (
    <html
      lang="nl"
      suppressHydrationWarning
      className={`${montserrat.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        {/* Adobe Typekit Fonts — deferred (only serves quasimoda + stenciletta) */}
        {typekitId && (
          <>
            <Script
              src={`https://use.typekit.net/${typekitId}.js`}
              strategy="afterInteractive"
            />
            <Script id="typekit-init" strategy="afterInteractive">
              {`try{Typekit.load({ async: true });}catch(e){console.error('Typekit load error:', e);}`}
            </Script>
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        <Script id="gtm-consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'analytics_storage':'denied','wait_for_update':500});`}
        </Script>
        <GoogleTagManagerLoader gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        <AccentStrip />
        <PageHeader youthTeams={youthTeams} seniorTeams={seniorTeams} />
        {/* pb reserves the footer diagonal's safe area so no route ends up
            with content clipped behind the green wedge. See #1360. */}
        <main className="pb-[var(--footer-diagonal)]">{children}</main>
        <PageFooter />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
