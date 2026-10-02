import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { RootDocument } from "./root-document";
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
import { degradeSection } from "@/lib/effect/degrade";
import {
  TeamRepository,
  type TeamNavVM,
} from "@/lib/repositories/team.repository";
import { BRAND, SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";

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
  // Section read: the nav's team list, not the page itself — every route
  // renders under this layout, so a failed read degrades to an empty nav
  // rather than taking the whole site down (#2864). The outer try/catch is
  // not the dead-catchAll anti-pattern this ticket removes elsewhere: it
  // covers `AppLayer` construction failing (e.g. a missing `KCVV_API_URL`),
  // which happens outside the effect `degradeSection`'s `catchAllCause`
  // wraps — an in-effect catch cannot see a failure to provide the effect's
  // own context. Verified empirically: with `KCVV_API_URL` unset, dropping
  // this try/catch 500s every route instead of rendering with an empty nav.
  let allTeams: TeamNavVM[] = [];
  try {
    allTeams = await runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAll();
        }),
        [],
        "[RootLayout] failed to load team nav — degrading to empty list",
      ),
    );
  } catch {
    allTeams = [];
  }

  // Only the senior sides get their own nav entry; `Jeugd` is a plain link to
  // the directory that indexes the rest (#2415).
  const seniorTeams = allTeams.filter((t) => !isUnderJeugd(t));

  return (
    <RootDocument>
      {/* WCAG 2.1-A skip link — first focusable element, visible only on
            keyboard focus. Retro register (sharp corners, ink border, mono). */}
      <a
        href="#main-content"
        className="focus:border-ink focus:bg-cream focus:text-ink focus:shadow-paper-sm sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:border-2 focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:font-semibold focus:tracking-wide focus:uppercase"
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
    </RootDocument>
  );
}
