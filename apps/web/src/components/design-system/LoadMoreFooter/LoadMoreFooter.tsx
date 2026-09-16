import { Button } from "../Button";
import { EmptyState } from "../EmptyState";
import { Spinner } from "../Spinner";

export interface LoadMoreFooterProps {
  /** Label on the load-more button, e.g. `"Meer nieuws laden"`. */
  label: string;
  hasMore: boolean;
  isLoading: boolean;
  /** Message for a failed batch, e.g. `"Artikelen laden mislukt."`. Absent
   *  → no error is showing. Its own last word (before trailing punctuation)
   *  is what `<EmptyState>` accents — every message here already ends
   *  "… mislukt.", the same failure word convention `/zoeken`'s card uses
   *  (#2815). */
  error?: string;
  /** Retries the failed batch; also the load-more handler. */
  onLoadMore: () => void;
}

/** The word `<EmptyState>` accents in `error` — its own last word before
 *  trailing punctuation, mirroring `<ErrorState>`'s own `lastWord()`
 *  default (#2815 scoping note: worth the three lines it costs). */
function lastWord(message: string): string {
  const words = message
    .trim()
    .replace(/[.!?]+$/, "")
    .split(/\s+/);
  return words[words.length - 1] ?? message;
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
        emphasis={{ text: lastWord(error) }}
        action={{ label: "Probeer opnieuw", onClick: onLoadMore }}
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
