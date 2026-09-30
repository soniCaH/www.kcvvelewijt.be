"use client";

import Script from "next/script";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ServerErrorState } from "./server-error-state";

// Same face and variable as `layout.tsx`: global-error replaces the root
// layout, so it inherits neither the stylesheet nor the fonts.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

/**
 * 500 boundary for a crash in the root layout's own chrome (header, footer,
 * cookie banner …) or in `error.tsx` itself — `error.tsx` does not wrap the
 * layout above it (#3311). Owns its `<html>`/`<body>`, the stylesheet and the
 * fonts, and shows the same locked 500 screen as `error.tsx`.
 *
 * No `metadata` export in a Client Component, so the tab title is a React
 * `<title>` element.
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const typekitId = process.env.NEXT_PUBLIC_TYPEKIT_ID;

  return (
    <html lang="nl" className={`${ibmPlexMono.variable} overflow-x-clip`}>
      <head>
        <title>Technische panne | KCVV Elewijt</title>
        {/* Freight (Adobe Typekit), same async loader as `layout.tsx`. Without
            it the metric-matched fallback stacks in globals.css still apply. */}
        {typekitId && (
          <Script id="typekit-init" strategy="afterInteractive">
            {`(function(d){var s=d.createElement("script");s.src="https://use.typekit.net/${typekitId}.js";s.async=true;s.onload=function(){try{Typekit.load({async:true});}catch(e){console.error("Typekit load error:",e);}};d.head.appendChild(s);})(document);`}
          </Script>
        )}
      </head>
      <body className="flex min-h-screen flex-col overflow-x-clip">
        <main className="flex flex-1 flex-col">
          <ServerErrorState retry={retry} />
        </main>
      </body>
    </html>
  );
}
