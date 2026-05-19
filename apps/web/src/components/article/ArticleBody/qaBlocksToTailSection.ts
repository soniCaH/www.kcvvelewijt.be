import type { PortableTextBlock } from "@portabletext/react";
import type { QaBlockValue } from "@/components/article/blocks/QaBlock/QaBlock";

/**
 * Discriminator for `qaBlock` Portable Text blocks, with the `groupAtTail`
 * authorial flag added in #1843. When `groupAtTail === true`, the block
 * is hoisted out of the in-flow PT stream by `qaBlocksToTailSection`
 * (this module) and rendered after `<EndMark>` by `nieuws/[slug]/page.tsx`
 * under the locked `<QASection>` composition. Pair-level dispatching
 * (standard / key / quote / rapid-fire) stays inside `<QaBlock>` for both
 * in-flow and tail blocks.
 */
export interface QaBlockBlock extends QaBlockValue {
  _type: "qaBlock";
  _key?: string;
  groupAtTail?: boolean;
}

export interface QaBlocksToTailSectionResult {
  /**
   * Portable Text blocks that should render in-flow via `<ArticleBody>`'s
   * `qaBlock` serializer. Preserves source order. Includes every non-
   * `qaBlock` block plus any `qaBlock` whose `groupAtTail` flag is falsy.
   */
  inFlow: PortableTextBlock[];
  /**
   * `qaBlock` blocks hoisted out of the in-flow stream to be rendered
   * after `<EndMark>` under a `<QASection>` wrapper. Source order
   * preserved across the hoisted set.
   */
  tailBlocks: QaBlockBlock[];
}

/**
 * Splits an article body into the in-flow PT stream + the tail
 * `qaBlock` collection. Pure module — no React, no Sanity coupling.
 *
 * Called by the article-detail page composition (5.C, #1800) before
 * the body reaches `<ArticleBody>`:
 *
 * ```tsx
 * const { inFlow, tailBlocks } = qaBlocksToTailSection(article.body);
 * return (
 *   <>
 *     <ArticleBody content={inFlow} subjects={article.subjects} />
 *     {tailBlocks.length > 0 ? (
 *       <QaTailSection blocks={tailBlocks} subjects={article.subjects} />
 *     ) : null}
 *   </>
 * );
 * ```
 *
 * Idempotent in shape: passing the returned `inFlow` array back through
 * the helper yields the same `inFlow` (and an empty `tailBlocks`),
 * because the in-flow set contains no `groupAtTail === true` blocks
 * by construction.
 */
export function qaBlocksToTailSection(
  body: PortableTextBlock[] | null | undefined,
): QaBlocksToTailSectionResult {
  if (!Array.isArray(body) || body.length === 0) {
    return { inFlow: [], tailBlocks: [] };
  }

  const inFlow: PortableTextBlock[] = [];
  const tailBlocks: QaBlockBlock[] = [];

  for (const block of body) {
    if (
      block._type === "qaBlock" &&
      (block as QaBlockBlock).groupAtTail === true
    ) {
      tailBlocks.push(block as QaBlockBlock);
    } else {
      inFlow.push(block);
    }
  }

  return { inFlow, tailBlocks };
}
