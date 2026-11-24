import type { PortableTextBlock } from "@portabletext/react";
import type { TransferFactValue } from "@/components/article/blocks/TransferFact/types";
import type { PortableTextBlockLike } from "./findPullquoteText";

/**
 * Segments `ArticleBody`'s `content` into PT-block runs, consecutive-
 * transferFact groups (5.d-tra adjacency rule), and consecutive-blockquote
 * groups.
 *
 * A quotation is one object (#2515 rule 2), but Portable Text does not
 * merge adjacent same-style blocks — an editor who pressed Enter between
 * paragraphs of ONE quoted statement produces N sibling `blockquote`-style
 * blocks, not one. Left ungrouped, that renders as N stacked taped cards
 * with N quote marks for what reads as a single quotation (measured on
 * production: `2024-03-25-kopzorgen-het-voetbal` carries 5 consecutive
 * blockquote blocks that are one continuous statement). Consecutive
 * blockquote-style blocks are grouped here into one `blockquote-group`
 * segment, rendered by `ArticleBody`'s `<BlockquoteGroup>` as one
 * `<PullQuote>` card carrying one paragraph per source block.
 *
 * Pure and JSX-free (no rendering) — `ArticleBody.tsx` owns turning these
 * segments into React nodes.
 */
export type ArticleBodySegment =
  | { kind: "pt"; key: string; blocks: PortableTextBlock[] }
  | { kind: "transfer-facts"; key: string; facts: TransferFactValue[] }
  | { kind: "blockquote-group"; key: string; blocks: PortableTextBlock[] };

function isBlockquoteStyleBlock(block: PortableTextBlock): boolean {
  return (
    block._type === "block" &&
    (block as PortableTextBlockLike).style === "blockquote"
  );
}

type Classified =
  | { kind: "pt"; item: PortableTextBlock }
  | { kind: "transfer-facts"; item: TransferFactValue }
  | { kind: "blockquote-group"; item: PortableTextBlock };

function classify(block: PortableTextBlock): Classified | null {
  if (block._type === "transferFact") {
    const fact = block as TransferFactValue;
    // Undropped playerName-less transferFact blocks are legitimately
    // absent from segmentation — `ArticleBody` never renders them.
    return fact.playerName?.trim()
      ? { kind: "transfer-facts", item: fact }
      : null;
  }
  if (isBlockquoteStyleBlock(block)) {
    return { kind: "blockquote-group", item: block };
  }
  return { kind: "pt", item: block };
}

/**
 * Consecutive blocks of one kind form one segment, so a kind change closes
 * the current run and starts a fresh one. Adding a fourth segment kind means
 * adding one `classify` branch, not touching every existing branch.
 */
export function segmentArticleBody(
  blocks: PortableTextBlock[],
): ArticleBodySegment[] {
  const runs = blocks
    .map(classify)
    .filter((item): item is Classified => item !== null)
    .reduce<Classified[][]>((acc, item) => {
      const last = acc[acc.length - 1];
      if (last?.[0]?.kind === item.kind) last.push(item);
      else acc.push([item]);
      return acc;
    }, []);

  // Each run holds items of one kind (the reduce above only joins equal
  // kinds), so the element-type assertions below are safe.
  return runs.map((run, idx): ArticleBodySegment => {
    const items = run.map((r) => r.item);
    if (run[0]!.kind === "pt") {
      return {
        kind: "pt",
        key: `pt-${idx}`,
        blocks: items as PortableTextBlock[],
      };
    }
    if (run[0]!.kind === "transfer-facts") {
      return {
        kind: "transfer-facts",
        key: `tf-${idx}`,
        facts: items as TransferFactValue[],
      };
    }
    return {
      kind: "blockquote-group",
      key: `bq-${idx}`,
      blocks: items as PortableTextBlock[],
    };
  });
}
