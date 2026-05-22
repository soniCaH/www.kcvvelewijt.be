/**
 * <QuotesBlock> — Phase 6.A player-profile quote interlude.
 *
 * Renders the SECOND `pullquote`-marked run in `player.bio` as a single
 * full-width `<PullQuote tone="ink">` card (6.d8 lock — Variant C; §5.3's
 * ink + cream pair is rejected). The dark-band aesthetic parked at 6.d4
 * (StatsStrip drop) lives here as the page's strongest punctuation.
 *
 * Span-indexing semantics are shared with `<BioBlock>` (which consumes
 * span #0) via `findNthPullquoteText` — keeps both surfaces in lockstep
 * when the marking rules evolve.
 *
 * Auto-hide branches:
 *  - `bio` empty / null / no renderable text → component returns `null`.
 *  - Fewer than 2 `pullquote`-marked runs → component returns `null`
 *    (BioBlock still shows span #0, QuotesBlock has nothing to lift).
 */

import type { PortableTextBlock } from "@portabletext/react";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { PullQuote } from "@/components/design-system/PullQuote";
import {
  findNthPullquoteText,
  hasRenderableBioContent,
} from "@/lib/portable-text/findPullquoteText";
import { cn } from "@/lib/utils/cn";

export interface QuotesBlockProps {
  /**
   * Sanity Portable Text `player.bio`. Passing `null` / `undefined` / an
   * empty array hides the component entirely (auto-hide branch).
   */
  bio?: PortableTextBlock[] | null;
  /**
   * Player display name surfaced in the ink card's attribution row. Omit
   * when the page hasn't resolved a name yet — the card still renders.
   */
  playerName?: string;
  className?: string;
}

export function QuotesBlock({ bio, playerName, className }: QuotesBlockProps) {
  if (!bio || bio.length === 0) return null;
  if (!hasRenderableBioContent(bio)) return null;

  const quoteText = findNthPullquoteText(bio, 1);
  if (quoteText === null) return null;

  return (
    <section
      data-testid="quotesblock"
      className={cn("bg-cream w-full px-4 py-12 lg:px-8 lg:py-16", className)}
    >
      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-8">
        <EditorialHeading
          level={2}
          size="display-md"
          emphasis={{ text: "woorden", highlight: true }}
        >
          In zijn eigen woorden.
        </EditorialHeading>
        <PullQuote
          tone="ink"
          attribution={{ name: playerName ?? "" }}
          rotation={-0.5}
        >
          {quoteText}
        </PullQuote>
      </div>
    </section>
  );
}
