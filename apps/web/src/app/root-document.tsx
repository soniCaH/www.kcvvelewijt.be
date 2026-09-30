import type { ReactNode } from "react";
import Script from "next/script";
import { IBM_Plex_Mono } from "next/font/google";

/**
 * The `<html>`/`<head>`/`<body>` shell shared by `layout.tsx` and
 * `global-error.tsx` (#3311). `global-error` replaces the root layout, so it
 * has to rebuild the document itself — sharing the shell here means the two
 * cannot drift (fonts, the Typekit loader, `data-scroll-behavior`, the
 * `overflow-x-clip` pair).
 */
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  // 500 is not decorative: the locked mono kicker / pill / field-label /
  // caption register is `font-medium`, and 12 call sites pair it with
  // `font-mono`. CSS weight matching resolves a missing 500 DOWNWARD to
  // 400, so leaving it out renders that register at regular the moment the
  // real face starts rendering at all (#2520).
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

export function RootDocument({
  head,
  children,
}: {
  /** Extra `<head>` content, after the Typekit loader (e.g. a `<title>`). */
  head?: ReactNode;
  children: ReactNode;
}) {
  const typekitId = process.env.NEXT_PUBLIC_TYPEKIT_ID;

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
        {head}
      </head>
      <body
        suppressHydrationWarning
        // `overflow-x-clip` — required alongside <html>'s, not redundant
        // with it. See the comment on <html>'s className above.
        className="flex min-h-screen flex-col overflow-x-clip"
      >
        {children}
      </body>
    </html>
  );
}
