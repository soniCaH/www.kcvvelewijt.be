/**
 * Dutch type label for a news card's mono meta row.
 *
 * `card-semantics-locked.md` §"Card meta row & footer" specifies that row as
 * `${variant} · ${date}` — "Transfer · Vr 9 mei". Only the two match variants
 * ever shipped it (5.d-mat-refine Card B). #2404 added `transfer` because the
 * homepage grid paints that type `jersey-deep` for the locked "green =
 * transfer" semantic, and a reader who has not learned the pattern — or cannot
 * see the green — had no signal at all.
 *
 * The label is not scoped to that grid, though the green is what forced the
 * question. `/nieuws` renders every card on cream and gets the word too, on the
 * same reasoning the two match variants already carry it there: the type is
 * worth naming wherever the card appears, and one helper that answers
 * differently per surface would be the harder thing to keep honest.
 *
 * Known cost, shared with `matchPreview` / `matchRecap` since 5.d: an article
 * whose first CMS tag repeats the type renders `● TRANSFER  TRANSFERS` — the
 * `typeLabel` and the tag `MonoLabel` sit side by side in `<NewsCard>`'s label
 * row. That is a `<NewsCard>` question (which of the two wins when they say the
 * same thing), not this lookup's.
 *
 * Still `undefined` for `interview` / `announcement` / `event` and for legacy
 * untyped articles. Naming every type is a card-semantics decision of its own
 * and would put a second mono label beside the CMS tag on every card in the
 * grid — the cost above, paid six times over.
 */
export type ArticleType =
  | "transfer"
  | "interview"
  | "announcement"
  | "event"
  | "matchPreview"
  | "matchRecap";

/**
 * Exhaustive, deliberately: `BG_BY_TYPE` — the colour half of the same
 * decision — is a `Record<ArticleType, …>` that fails to compile when a type is
 * added. An if-chain here would have let the next `ArticleType` take a
 * background with no word to explain it, which is #2404 reintroduced by
 * construction. `undefined` is a choice each type has to make explicitly.
 */
const LABEL_BY_TYPE: Record<ArticleType, string | undefined> = {
  transfer: "Transfer",
  matchPreview: "Voorbeschouwing",
  matchRecap: "Matchverslag",
  interview: undefined,
  announcement: undefined,
  event: undefined,
};

export const articleTypeCardLabel = (
  articleType: ArticleType | string | null | undefined,
): string | undefined => {
  // The callers' `articleType` is CMS-authored and typed as a union that a
  // stale document can still fall outside of, so this stays a lookup with a
  // guard rather than a bare index.
  if (!articleType || !Object.hasOwn(LABEL_BY_TYPE, articleType)) {
    return undefined;
  }
  return LABEL_BY_TYPE[articleType as ArticleType];
};
