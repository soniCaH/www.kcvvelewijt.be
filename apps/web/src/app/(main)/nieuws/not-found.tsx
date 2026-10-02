import type { Metadata } from "next";
import { ErrorState } from "@/components/design-system";
import { ErrorAnalytics } from "@/components/analytics";

/**
 * Segment 404 for a dead article slug (#2522). Mirrors the global
 * `src/app/not-found.tsx` shell, but the recovery is back to the news archive
 * rather than the homepage (the site header already links home).
 *
 * Lives at `(main)/nieuws/`, the parent of `[slug]`, not inside it: since
 * #2968 the existence check calls `notFound()` from `[slug]/layout.tsx`, and a
 * `not-found.tsx` only catches `notFound()` thrown by its segment's
 * *children* — never by its own segment's layout. That layout still decides
 * the HTTP status (404). The list page lives at `(landing)/nieuws/`, a
 * different route-group branch, so this boundary cannot affect it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NieuwsNotFound() {
  return (
    <ErrorAnalytics code="404">
      <ErrorState
        code="404"
        codeLine="Fout 404 · artikel niet gevonden"
        pun="Buiten de lijnen"
        body="Dit artikel staat niet (meer) op het veld. Misschien is de link verplaatst of is het artikel verwijderd."
        actions={[
          {
            label: "Naar het nieuws",
            href: "/nieuws",
            variant: "primary",
            analyticsAction: "news",
          },
          {
            label: "Zoeken",
            href: "/zoeken",
            variant: "ghost",
            analyticsAction: "search",
          },
        ]}
      />
    </ErrorAnalytics>
  );
}
