"use client";

import { ErrorState } from "@/components/design-system";
import { ErrorAnalytics } from "@/components/analytics";

/**
 * Global 500 error boundary (Phase 8.4). Renders the shared `<ErrorState>` in
 * the chosen "centered" layout with the locked 500 copy + actions
 * (`8e2-copy-locked.md`). Stays `"use client"` and self-contained at the root
 * segment (outside the `(main)` layout); the `reset()` callback is wired to the
 * primary "Probeer opnieuw" action. Wrapped in `<ErrorAnalytics>` (Phase 8.5)
 * so it fires `error_view` + `error_action_click`.
 *
 * No `metadata`/`noindex` export is possible here — error boundaries are Client
 * Components — but the response carries the non-indexable 500 status, so a
 * crawler never indexes it.
 */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorAnalytics code="500">
      <ErrorState
        code="500"
        codeLine="Fout 500 · er ging iets mis"
        pun="Technische panne"
        body="Er ging iets mis aan onze kant. Probeer het zo dadelijk opnieuw."
        actions={[
          {
            label: "Probeer opnieuw",
            onClick: reset,
            variant: "primary",
            analyticsAction: "retry",
          },
          {
            label: "Naar de homepage",
            href: "/",
            variant: "ghost",
            analyticsAction: "home",
          },
        ]}
      />
    </ErrorAnalytics>
  );
}
