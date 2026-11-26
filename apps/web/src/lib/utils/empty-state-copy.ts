/**
 * Shared sentence builders for `<EmptyState tier="surface">` bodies.
 *
 * A peer of `match-display.ts`, which exists for the identical reason: five
 * to six hosts had hand-copied the same sentence skeleton with only a noun
 * or two differing, and one of the copies would eventually drift (#2562
 * review round 3). Centralises the two recurring skeletons; the "Toon
 * alles" / "Toon alle categorieën" button labels stay inline at each call
 * site — they genuinely differ per host, and centralising them would be
 * false sharing.
 */

/**
 * The `reason: "filtered"` body — a filter emptied the surface, offering
 * the reader another facet to try. `noun` is the destination the undo
 * points at in prose (`"het volledige overzicht"`, `"alle evenementen"`).
 */
export const filteredEmptyBody = (noun: string): string => {
  return `Probeer een andere categorie, of bekijk ${noun}.`;
};

/**
 * The genuine-emptiness body — "Zodra {condition}, {verschijnt|verschijnen}
 * {subject} hier." `plural` picks the verb agreement for `subject`
 * ("verschijnen de wedstrijden" vs "verschijnt het").
 */
export const pendingEmptyBody = (
  condition: string,
  subject: string,
  plural = false,
): string => {
  return `Zodra ${condition}, ${plural ? "verschijnen" : "verschijnt"} ${subject} hier.`;
};
