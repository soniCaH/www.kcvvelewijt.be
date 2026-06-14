import type { Metadata } from "next";
import { ErrorState } from "@/components/design-system";
import { ErrorAnalytics } from "@/components/analytics";

/**
 * Global 404 page (Phase 8.4). Renders the shared `<ErrorState>` in the chosen
 * "centered" layout with the locked 404 copy + actions (`8e2-copy-locked.md`):
 * a way home plus a search affordance for a lost visitor. Self-contained on
 * cream — the SiteHeader/Footer come from the root layout. Wrapped in
 * `<ErrorAnalytics>` (Phase 8.5) so it fires `error_view` + `error_action_click`.
 */

/**
 * A 404 already returns the non-indexable 404 status; the explicit `noindex`
 * is belt-and-braces and mirrors the repo convention (cf.
 * `/tegenstander/[clubId]`) so search engines never index a not-found shell.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ErrorAnalytics code="404">
      <ErrorState
        code="404"
        codeLine="Fout 404 · pagina niet gevonden"
        pun="Buiten de lijnen"
        body="Deze pagina staat niet (meer) op het veld. Misschien is de link verplaatst of bestaat ze niet meer."
        actions={[
          {
            label: "Naar de homepage",
            href: "/",
            variant: "primary",
            analyticsAction: "home",
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
