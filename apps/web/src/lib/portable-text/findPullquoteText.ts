/**
 * Shared utility for the Phase 6.A `pullquote` Portable Text decorator
 * (added by tracer issue #1881). Consumed by `<BioBlock>` (span #1) and
 * `<QuotesBlock>` (span #2) so both surfaces stay in lockstep when the
 * marking rules evolve.
 *
 * A "pullquote span" is one contiguous run of adjacent PT spans whose
 * `marks` array contains `"pullquote"`. A run continues across spans so
 * an inline emphasis (e.g. a `strong` span sitting inside the marked
 * range) doesn't break the lift. The run ends at the first unmarked
 * span OR at the end of the block. Subsequent marked spans inside the
 * same block — or in later blocks — become distinct runs.
 */

import type { PortableTextBlock } from "@portabletext/react";

export type PortableTextSpanLike = {
  _type?: string;
  text?: string;
  marks?: string[];
};

/**
 * Shared loose/duck-typed shape for a Portable Text `block` — narrower than
 * the library's own type (which is a wide union covering every registered
 * object type), just the fields callers across `article/ArticleBody`,
 * `player/BioBlock`, and `player/QuotesBlock` actually read. `listItem` is
 * optional and only meaningful to callers that care whether a "normal"
 * style block is really a list item (see `ArticleBody`'s
 * `isNormalParagraph`) — everything else here ignores it.
 */
export type PortableTextBlockLike = {
  _type?: string;
  style?: string;
  listItem?: string;
  children?: PortableTextSpanLike[];
};

function extractBlockText(block: PortableTextBlock): string {
  const children = (block as PortableTextBlockLike).children;
  if (!Array.isArray(children)) return "";
  return children
    .map((span) => span.text ?? "")
    .join("")
    .trim();
}

/**
 * `true` when at least one block in the array has non-whitespace text.
 * Used by both BioBlock and QuotesBlock for their auto-hide branch when
 * `player.bio` is structurally non-empty but textually blank.
 */
export function hasRenderableBioContent(blocks: PortableTextBlock[]): boolean {
  return blocks.some((b) => extractBlockText(b).length > 0);
}

/** The trimmed, non-empty runs of adjacent `pullquote`-marked spans in one block. */
const pullquoteRunsOf = (children: PortableTextSpanLike[]): string[] => {
  const { runs, current } = children.reduce<{
    runs: string[];
    current: string | null;
  }>(
    (acc, span) =>
      span.marks?.includes("pullquote")
        ? { ...acc, current: (acc.current ?? "") + (span.text ?? "") }
        : {
            runs: acc.current === null ? acc.runs : [...acc.runs, acc.current],
            current: null,
          },
    { runs: [], current: null },
  );
  return (current === null ? runs : [...runs, current])
    .map((text) => text.trim())
    .filter((text) => text.length > 0);
};

/**
 * Return the text of the Nth (0-indexed) contiguous `pullquote`-marked
 * run across all blocks, or `null` when fewer than `n + 1` runs exist.
 * BioBlock consumes `n = 0`, QuotesBlock consumes `n = 1`. Spans #3+
 * are ignored by both surfaces.
 */
export function findNthPullquoteText(
  blocks: PortableTextBlock[],
  n: number,
): string | null {
  if (n < 0) return null;
  const runs = blocks.flatMap((block) => {
    const children = (block as PortableTextBlockLike).children;
    return Array.isArray(children) ? pullquoteRunsOf(children) : [];
  });
  return runs[n] ?? null;
}
