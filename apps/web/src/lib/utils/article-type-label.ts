/**
 * Dutch type label for the match-variant news cards (5.d-mat-refine Card B).
 *
 * Cards stay generic on data (no per-card PSD score/date fetch), so the only
 * thing we signal is the article *type*. Returns `undefined` for every
 * non-match type, so existing cards (interview / transfer / event /
 * announcement / legacy untyped) render unchanged — extending a type label to
 * those is a separate card-semantics decision.
 */
export function matchTypeCardLabel(
  articleType: string | null | undefined,
): string | undefined {
  if (articleType === "matchPreview") return "Voorbeschouwing";
  if (articleType === "matchRecap") return "Matchverslag";
  return undefined;
}
