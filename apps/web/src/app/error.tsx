"use client";

import { ErrorState } from "@/components/design-system";

/**
 * Global 500 error boundary (Phase 8.4). Renders the shared `<ErrorState>` in
 * the chosen "centered" layout with the locked 500 copy + actions
 * (`8e2-copy-locked.md`). Stays `"use client"` and self-contained at the root
 * segment (outside the `(main)` layout); the `reset()` callback is wired to the
 * primary "Probeer opnieuw" action.
 */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      code="500"
      codeLine="Fout 500 · er ging iets mis"
      pun="Technische panne"
      body="Er ging iets mis aan onze kant. Probeer het zo dadelijk opnieuw."
      actions={[
        { label: "Probeer opnieuw", onClick: reset, variant: "primary" },
        { label: "Naar de homepage", href: "/", variant: "ghost" },
      ]}
    />
  );
}
