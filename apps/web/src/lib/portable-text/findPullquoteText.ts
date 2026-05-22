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

type PortableTextSpanLike = {
  _type?: string;
  text?: string;
  marks?: string[];
};

type PortableTextBlockLike = {
  _type?: string;
  style?: string;
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
  const runs: string[] = [];
  for (const block of blocks) {
    const children = (block as PortableTextBlockLike).children;
    if (!Array.isArray(children)) continue;
    let collecting = false;
    let text = "";
    for (const span of children) {
      const isPullquote = span.marks?.includes("pullquote") ?? false;
      if (isPullquote) {
        collecting = true;
        text += span.text ?? "";
      } else if (collecting) {
        const trimmed = text.trim();
        if (trimmed.length > 0) runs.push(trimmed);
        text = "";
        collecting = false;
        if (runs.length > n) return runs[n] ?? null;
      }
    }
    if (collecting) {
      const trimmed = text.trim();
      if (trimmed.length > 0) runs.push(trimmed);
      if (runs.length > n) return runs[n] ?? null;
    }
  }
  return runs[n] ?? null;
}
