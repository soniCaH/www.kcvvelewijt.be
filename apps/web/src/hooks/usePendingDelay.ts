import { useEffect, useState } from "react";

/** The Chrome speed (DESIGN.md → Motion Vocabulary): no new number. */
export const PENDING_DELAY_MS = 150;

/**
 * `true` once `pending` has held for `PENDING_DELAY_MS` — the one delay behind
 * every "waiting" dot (`LinkPendingDots`, a pending `FilterTabs` chip).
 *
 * The delay is a timer, not a CSS fade: a faded-in element still takes its
 * inline size (and a flex parent's `gap`) from the first pending frame, so
 * every tap would re-wrap prose or shift a chip row, even on a fast
 * connection. Gated on this flag the dots are unmounted until the delay has
 * passed, so they take no room at all and a fast answer shows nothing.
 *
 * `resetOn` restarts the delay while `pending` stays true (e.g. the pending
 * chip changes from one to another).
 */
export function usePendingDelay(pending: boolean, resetOn?: unknown): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setElapsed(true), PENDING_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setElapsed(false);
    };
  }, [pending, resetOn]);

  return pending && elapsed;
}
