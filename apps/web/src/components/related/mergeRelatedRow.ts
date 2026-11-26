/**
 * `mergeRelatedRow` — the ordering/dedupe/cap engine behind `<RelatedRow>`
 * (#2443 rule 2, #2581).
 *
 * Five tiers merge into one list, most-relevant-first regardless of type:
 * **domain → curated → reference → semantic → siblings.** A domain relation
 * (bounded + defining, e.g. a player's own team) always outranks an editor's
 * curated pick, which outranks a body-text mention, which outranks an
 * AI-scored suggestion, which outranks another item of the page's own kind.
 *
 * Generic over any item shape carrying `href` — the merge doesn't care
 * whether an item came from a Sanity document, a BFF read, or was hand-built
 * by the page (the `/nieuws/[slug]` match fold-in, `/ploegen/[slug]`'s own
 * fixture-list card) for a destination that has no `RelatedContentItem`
 * union member of its own. `href` is the identity: one destination is one
 * card ("cardinality is not a treatment", #2443 rule 3), so two items
 * pointing at the same href are the same relation twice, whichever tiers
 * they arrived from.
 *
 * Dedup runs tier-by-tier in merge order, so the first tier to mention a
 * destination keeps it and every later occurrence — including a later item
 * in the SAME tier — is dropped silently. The siblings tier is length-capped
 * at `RELATED_ROW_MAX_SIBLINGS` *after* dedup, so a sibling that turned out
 * to duplicate an earlier tier's item doesn't cost the tier one of its three
 * slots. The whole merged list is then capped at `RELATED_ROW_MAX_ITEMS`.
 */

export const RELATED_ROW_MAX_ITEMS = 8;
export const RELATED_ROW_MAX_SIBLINGS = 3;

export interface RelatedRowTiers<T extends { href: string }> {
  /** Bounded + defining structural relations (#2443 rule 4) — first. */
  domain: readonly T[];
  /** Editor-curated picks. */
  curated: readonly T[];
  /** Explicit in-body mentions. */
  reference: readonly T[];
  /** AI/vector-scored suggestions. */
  semantic: readonly T[];
  /** Other items of the page's own kind — last, capped at 3. */
  siblings: readonly T[];
}

const takeUnseen = <T extends { href: string }>(
  items: readonly T[],
  seen: Set<string>,
  limit?: number,
): T[] => {
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    out.push(item);
    if (limit !== undefined && out.length >= limit) break;
  }
  return out;
};

export const mergeRelatedRow = <T extends { href: string }>(
  tiers: RelatedRowTiers<T>,
): T[] => {
  const seen = new Set<string>();
  const merged = [
    ...takeUnseen(tiers.domain, seen),
    ...takeUnseen(tiers.curated, seen),
    ...takeUnseen(tiers.reference, seen),
    ...takeUnseen(tiers.semantic, seen),
    ...takeUnseen(tiers.siblings, seen, RELATED_ROW_MAX_SIBLINGS),
  ];

  return merged.slice(0, RELATED_ROW_MAX_ITEMS);
};
