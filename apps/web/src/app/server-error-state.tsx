"use client";

import { ErrorState } from "@/components/design-system";
import { ErrorAnalytics } from "@/components/analytics";

/**
 * The locked 500 screen (`8e2-copy-locked.md`), shared by `error.tsx` (a crash
 * inside a page) and `global-error.tsx` (a crash in the root layout) so the
 * two boundaries cannot drift in copy. "Probeer opnieuw" calls the `retry()`
 * Next hands the boundary — it re-fetches and re-renders, where `reset()` only
 * re-renders the payload that already failed (#3298).
 */
export function ServerErrorState({ retry }: { retry: () => void }) {
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
            onClick: retry,
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
