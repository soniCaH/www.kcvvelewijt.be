import { Button } from "../Button";
import { EmptyState } from "../EmptyState";
import { Spinner } from "../Spinner";

export interface LoadMoreFooterProps {
  /** Label on the load-more button, e.g. `"Meer nieuws laden"`. */
  label: string;
  hasMore: boolean;
  isLoading: boolean;
  /**
   * A failed batch: the message plus the substring of it that
   * `<EmptyState>` accents. Absent → no error is showing. Paired into one
   * object, not two separate optional props, on purpose (#2815 review
   * follow-up): `emphasis` is meaningless without `message` and `message`
   * degrades badly without `emphasis` — an omitted `errorEmphasis` used to
   * fall back to `{ text: "" }`, which `<EmptyState>`'s notice member
   * (`emphasis` is *required* there) accepts without complaint, silently
   * dropping the accent and misdirecting the dev-only "not found" warning
   * at a missing substring instead of a forgotten prop. Same shape as the
   * `reason` admission rule this file documents: a value exists to make a
   * companion field compiler-required, not to be a label for copy. The
   * accent must never be derived from `message` (#2815 review findings
   * 4/5) — a "last word" heuristic accents whatever the message happens to
   * end on, not necessarily the failure itself (#2469 resolution rule 3).
   * Both current callers pass `emphasis: "mislukt"`.
   */
  error?: { message: string; emphasis: string };
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
  onLoadMore,
}: LoadMoreFooterProps) {
  if (error) {
    return (
      <EmptyState
        tier="slot"
        reason="unavailable"
        live
        emphasis={{ text: error.emphasis }}
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
        {error.message}
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
