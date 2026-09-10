import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AccentStrip } from "@/components/layout/AccentStrip";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { isUnderJeugd } from "@/components/layout/menuItems";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { GoogleTagManagerLoader } from "@/components/layout/GoogleTagManagerLoader";
// Deep import, not the `@/components/analytics` barrel — deliberately: the
// barrel also re-exports PageViewTracker/ErrorAnalytics, and importing it
// here would drag both into every route's root chunk.
import { EmptyStateUndoTracker } from "@/components/analytics/EmptyStateUndoTracker";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  TeamRepository,
  type TeamNavVM,
} from "@/lib/repositories/team.repository";
import { BRAND, SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";

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

  // Only the senior sides get their own nav entry; `Jeugd` is a plain link to
  // the directory that indexes the rest (#2415).
  const seniorTeams = allTeams.filter((t) => !isUnderJeugd(t));

  return (
    <html
      lang="nl"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      // `overflow-x-clip` here AND on <body> below — #2912. A press-down
      // consumer (e.g. the homepage <EditorialHero>) can be full-bleed and
      // translate +4px on hover; that still counts toward `scrollWidth`, and
      // with only one of the two elements clipped, Chromium still lets the
      // page scroll sideways (body-only and html-only were both tested live
      // and both failed — verified with a real scroll attempt, not just a
      // `scrollWidth` read, since `clip` can leave that inflated without
      // anything actually being reachable). Dropping either one silently
      // reintroduces the bug. Must stay `clip`, never `hidden`: `hidden`
      // creates a scroll container that the sticky <SiteHeader> positions
      // against, which breaks it (confirmed: parks the header at y:-1200
      // instead of y:0). See `apps/web/test/e2e/homepage.spec.ts`'s #2912
      // test and `apps/web/DESIGN.md`'s press-down section for the guard
      // contract every future full-bleed press-down consumer relies on.
      className={`${ibmPlexMono.variable} overflow-x-clip`}
    >
      <head>
        {/* Adobe Typekit (Adobe Fonts) — serves Freight Display/Big Pro + Freight
            Sans Pro (the body font as of #2174). Loaded async (non-blocking): an
            injected <script> fetches the kit and calls Typekit.load() in its own
            onload, so load() never races ahead of the kit defining `Typekit`. If
            Adobe is slow/down the page is unaffected — text falls back to the
            metric-matched fallback stacks (`Freight Sans/Display Fallback` in
            globals.css); mono (IBM Plex Mono) is self-hosted via next/font. */}
        {typekitId && (
          <Script id="typekit-init" strategy="afterInteractive">
            {`(function(d){var s=d.createElement("script");s.src="https://use.typekit.net/${typekitId}.js";s.async=true;s.onload=function(){try{Typekit.load({async:true});}catch(e){console.error("Typekit load error:",e);}};d.head.appendChild(s);})(document);`}
          </Script>
        )}
      </head>
      <body
        suppressHydrationWarning
        // `overflow-x-clip` — required alongside <html>'s, not redundant
        // with it. See the comment on <html>'s className above.
        className="flex min-h-screen flex-col overflow-x-clip"
      >
        {/* WCAG 2.1-A skip link — first focusable element, visible only on
            keyboard focus. Retro register (sharp corners, ink border, mono). */}
        <a
          href="#main-content"
          className="focus:border-ink focus:bg-cream focus:text-ink focus:shadow-paper-sm sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:border-2 focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:font-semibold focus:tracking-wide focus:uppercase focus:outline-none"
        >
          Naar de inhoud
        </a>
        <Script id="gtm-consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'analytics_storage':'denied','wait_for_update':500});`}
        </Script>
        <GoogleTagManagerLoader gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        <ScrollToTop />
        {/* Global empty-state-undo click listener (#2719) — see
            EmptyStateUndoTracker.tsx for why it lives here. */}
        <EmptyStateUndoTracker />
        <AccentStrip />
        <SiteHeader seniorTeams={seniorTeams} />
        {/* flex-1 column so a short page's footer sticks to the viewport
            bottom (ZOEK-1 / TEGEN-1) instead of floating up or leaving a gap. */}
        <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
