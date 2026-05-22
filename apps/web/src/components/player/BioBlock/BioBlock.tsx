/**
 * <BioBlock> — Phase 6.A player bio section for `/spelers/[slug]`.
 *
 * Renders `player.bio` Portable Text via the article-body serializer pattern.
 * The new `pullquote` PT decorator (added by the Phase 6.A tracer, #1881)
 * has dual rendering:
 *
 *  - **Inline:** marked substrings render with `<HighlighterStroke>` so the
 *    quote reads as continuous prose with a marker pulled across it.
 *  - **Right column:** the FIRST marked substring is lifted out and shown
 *    again as a jersey-deep `<PullQuote>` card next to the paragraph
 *    (6.d5 lock — "same text, two surfaces").
 *
 * Auto-hide branches:
 *  - `bio` empty / null / no renderable text → component returns `null`.
 *  - No `pullquote` decorator → paragraph renders alone, the right column
 *    collapses and the grid falls back to single-column.
 *
 * The `pullquote` mark serializer is local to BioBlock and is NOT wired
 * into `<ArticleBody>` — article bodies have their own `pullQuote` block
 * type (a separate object type, not a decorator). The mark name is also
 * intentionally lowercase (`pullquote`) to distinguish it from the article
 * `pullQuote` block in Portable Text logs.
 */

import { PortableText } from "@portabletext/react";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import type { ReactNode } from "react";
import { HighlighterStroke } from "@/components/design-system/HighlighterStroke";
import { PullQuote } from "@/components/design-system/PullQuote";
import {
  findNthPullquoteText,
  hasRenderableBioContent,
} from "@/lib/portable-text/findPullquoteText";
import { cn } from "@/lib/utils/cn";

export interface BioBlockProps {
  /**
   * Sanity Portable Text `player.bio`. Passing `null` / `undefined` / an
   * empty array hides the component entirely (auto-hide branch).
   */
  bio?: PortableTextBlock[] | null;
  /**
   * Player display name surfaced in the right-column `<PullQuote>`
   * attribution row. Omit if the page hasn't resolved a name yet — the
   * card still renders, just without an attributed speaker.
   */
  playerName?: string;
  className?: string;
}

const components: PortableTextComponents = {
  marks: {
    pullquote: ({ children }: { children?: ReactNode }) => (
      <HighlighterStroke color="jersey">{children}</HighlighterStroke>
    ),
  },
};

export function BioBlock({ bio, playerName, className }: BioBlockProps) {
  if (!bio || bio.length === 0) return null;
  if (!hasRenderableBioContent(bio)) return null;

  const pullquoteText = findNthPullquoteText(bio, 0);
  const hasPullquote = pullquoteText !== null;

  return (
    <section
      data-testid="bioblock"
      data-has-pullquote={hasPullquote ? "true" : "false"}
      className={cn("bg-cream w-full px-4 py-12 lg:px-8 lg:py-16", className)}
    >
      <div
        className={cn(
          "mx-auto grid w-full gap-8",
          hasPullquote
            ? "max-w-[var(--container-wide)] lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:gap-12"
            : "max-w-[var(--container-prose)] grid-cols-1",
        )}
      >
        <div className="prose-bio text-ink font-body text-base leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0">
          <PortableText value={bio} components={components} />
        </div>
        {hasPullquote ? (
          <aside
            data-testid="bioblock-pullquote"
            className="self-start lg:sticky lg:top-8"
          >
            <PullQuote
              tone="jersey"
              attribution={{ name: playerName ?? "" }}
              rotation={2}
              interactive="tilt"
            >
              {pullquoteText}
            </PullQuote>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
