import { Button } from "../Button";
import { EmptyState } from "../EmptyState";
import { Spinner } from "../Spinner";

export interface LoadMoreFooterProps {
  /** Label on the load-more button, e.g. `"Meer nieuws laden"`. */
  label: string;
  hasMore: boolean;
  isLoading: boolean;
  /** Message for a failed batch, e.g. `"Artikelen laden mislukt."`. Absent
   *  → no error is showing. */
  error?: string;
  /**
   * The substring of `error` that `<EmptyState>` accents — an explicit
   * caller-supplied word, not derived from `error` itself (#2815 review
   * findings 4/5: a "last word" heuristic silently diverges the moment a
   * caller's message doesn't end on the failure word — #2469 resolution
   * rule 3 requires the accent land on the failure, not the subject, and a
   * heuristic can't tell those apart). Both current callers pass
   * `"mislukt"`.
   */
  errorEmphasis?: string;
  /** Retries the failed batch; also the load-more handler. */
  onLoadMore: () => void;
}

/**
 * The tail of a paginated listing: a failed-batch notice with a retry, the
 * in-flight spinner, and the load-more button — exactly one of the three shows
 * at a time.
 *
 * One component rather than one per listing: `/nieuws` and `/galerij` are the
 * two listings on the shared 24 + 12 contract (#2569 / decision #2431), and a
 * hand-copied second footer is how that contract grows a second look.
 *
 * The failed-batch notice renders through `<EmptyState tier="slot"
 * reason="unavailable">` (#2815) — the "Tier 2 + action" register #2470's
 * copy table asked for from the start, which the primitive didn't carry
 * until #2815 gave the notice member an optional `action`. `onLoadMore`
 * doubles as the retry handler, the same wiring the bespoke button used.
 */
export function LoadMoreFooter({
  label,
  hasMore,
  isLoading,
  error,
  errorEmphasis,
  onLoadMore,
}: LoadMoreFooterProps) {
  if (error) {
    return (
      <EmptyState
        tier="slot"
        reason="unavailable"
        live
        emphasis={{ text: errorEmphasis ?? "" }}
        action={{ label: "Probeer opnieuw", onClick: onLoadMore }}
        // The footer's own vertical air (#2815 review finding 2) — the two
        // surviving branches below keep `py-8` / `pt-2 pb-4` of their own,
        // and the bespoke markup this replaced had `py-4`. `<EmptyState>`'s
        // own `px-6 py-8` sits INSIDE its dashed frame, so without this the
        // frame's top edge sits flush against whatever renders above it
        // (e.g. `TapedCardGrid`'s bare, margin-less root on `/nieuws` and
        // `/galerij`).
        className="my-8"
      >
        {error}
      </EmptyState>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner variant="compact" label="Laden..." />
      </div>
    );
  }

  if (!hasMore) return null;

  return (
    <div className="flex justify-center pt-2 pb-4">
      <Button variant="secondary" size="md" onClick={onLoadMore}>
        {label}
      </Button>
    </div>
  );
}
