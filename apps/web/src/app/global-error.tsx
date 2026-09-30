"use client";

import "./globals.css";
import { RootDocument } from "./root-document";
import { ServerErrorState } from "./server-error-state";

/**
 * 500 boundary for a crash in the root layout's own chrome (header, footer,
 * cookie banner …) or in `error.tsx` itself — `error.tsx` does not wrap the
 * layout above it (#3311). Owns the document via the shared `<RootDocument>`,
 * the stylesheet and the fonts, and shows the same locked 500 screen as
 * `error.tsx`.
 *
 * Analytics: on a first-load crash this boundary reports nothing. The GTM
 * loader + consent-default script (what creates `window.dataLayer`) live in
 * the root layout, and a stored consent choice is only restored by
 * `<CookieConsentBanner>`; mounting GTM here without the banner would load
 * tracking with no way to honour or change consent, so `trackEvent` stays a
 * no-op until `dataLayer` exists. After a client-side crash `dataLayer`
 * survives from the layout and `error_view`/`error_action_click` fire as usual.
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
  return (
    <RootDocument head={<title>Technische panne | KCVV Elewijt</title>}>
      <main className="flex flex-1 flex-col">
        <ServerErrorState retry={retry} />
      </main>
    </RootDocument>
  );
}
