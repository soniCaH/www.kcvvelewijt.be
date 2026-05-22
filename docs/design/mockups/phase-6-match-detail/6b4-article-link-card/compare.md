# 6.B.d4 · `<MatchArticleLinkCard>` — primitive comparison map

**Round 1.** The new card surfaces an editorial article about this match (a `matchPreview` for upcoming, a `matchRecap` for finished) as a single link element on `/wedstrijd/[matchId]`. Auto-hides when no such article exists.

Visual artifact: `round-1-article-link-card-comparisons.html` — three variants of treatment. Renders the **finished** state (linking to a `matchRecap`); the upcoming state is identical in shape, only the badge / kicker copy differs.

## Reference locks consumed

- `data-reality-locked.md` (6.B.d0) — articles surface via the `matchPreview` / `matchRecap` articleType (per #1470); each article has cover image + title + kicker + publishedAt + author
- `page-composition-locked.md` (6.B.d1) — card mounts between `<MatchEventsSection>` and `<RelatedArticlesSection>`; auto-hides if no article exists
- `matchhero-locked.md` (6.B.d2) + `lineup-events-locked.md` (6.B.d3) — sets the page's editorial paper-card vocabulary
- Phase 5 `<EditorialHero>` / `<NewsCard>` precedents — these define the article-presentation vocabulary; the card should feel cousinly to them
- Phase 4.5 R10 card structure — flush-edge cards with outer `<TapedCard>` + image bleed + 1px ink rule between zones

## Variants

- **A — Compact one-line link.** Single inline row: kicker `LEES OOK` → article title → ellipsis arrow. No image. Sits like an "in-text" call-out — minimum visual weight; the focus stays on the lineup + events above.
- **B — Hero-style cover card.** Full-width `<TapedCard>` with the article cover image bleeding to the top edge, kicker + heading below, optional one-line lead. Same shape as `<NewsCard>` on the homepage — most prominent of the three options. Strongest "go read this" CTA.
- **C — Inline magazine banner.** Mid-weight horizontal card — small square cover image on the left (square aspect, ~120px), article kicker + title + lead on the right, arrow at the far right. Reads like a magazine sidebar callout. Compromise between A's restraint and B's prominence.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost | Notes |
| ------- | ------- | -------- | ---- | ----- |
| **A** | 0 | Low | Pure styled link with mono caps kicker | Maps 1:1 onto any "see also" / "lees ook" pattern; reusable elsewhere |
| **B** | 0 | Low | Composes `<TapedCard>` + `<TapedFigure>` + `<EditorialHeading>` exactly like `<NewsCard>` | Visually identical to a homepage news card — owner may want to differentiate |
| **C** | 1 (small) | Medium | New small primitive: horizontal card layout with square cover on the left | Reusable pattern (could power related-articles, sponsor banners) |

## Reading-intent trade-off

| Variant | Reader's signal | Reader's likely action |
| --- | --- | --- |
| A | "There's an article" — quiet pointer | Click if curious; easy to scroll past |
| B | "There's an article and you should read it" — strong CTA | High click intent; lineup + events feel less central |
| C | "There's an article" — visible but doesn't dominate | Click-through likely; lineup + events stay central |

## Cross-state behaviour

Exhaustive truth table — every combination of match status × article presence. "Render X" picks the linked article; "hide" returns `null` per the 6.B.d1 auto-hide rule.

| Match status | `matchRecap` exists? | `matchPreview` exists? | Behaviour | Kicker |
| --- | --- | --- | --- | --- |
| `finished` (or any edge state: `forfeited` / `postponed` / `cancelled` / `stopped`) | yes | yes | Render **recap** (preview is stale post-kickoff) | `LEES HET VERSLAG · MATCHVERSLAG` |
| `finished` (or edge) | yes | no  | Render **recap** | `LEES HET VERSLAG · MATCHVERSLAG` |
| `finished` (or edge) | no  | yes | Render **preview** as a fallback (rare but useful — e.g. recap unwritten, preview still on file) | `LEES DE VOORBESCHOUWING · MATCHPREVIEW` |
| `finished` (or edge) | no  | no  | Hide (`null`) | — |
| `scheduled` (upcoming) | yes | yes | Render **preview** (recap exists but is anomalous on an upcoming match — log a warning in dev) | `LEES DE VOORBESCHOUWING · MATCHPREVIEW` |
| `scheduled` | yes | no  | Render **recap** as a fallback (rare; usually a data anomaly — log a warning in dev) | `LEES HET VERSLAG · MATCHVERSLAG` |
| `scheduled` | no  | yes | Render **preview** | `LEES DE VOORBESCHOUWING · MATCHPREVIEW` |
| `scheduled` | no  | no  | Hide (`null`) | — |

Rule summary: **recap wins on finished/edge states; preview wins on scheduled**. Fallbacks ship for asymmetric data — if the dominant article is missing, render the other rather than hide outright. Anomalous combinations (recap on a scheduled match, etc.) render in dev-warning mode but ship live without error.

## Things this drill does NOT decide

- Article-side schema for `articleMatch` reference field — that's a #1470 concern
- Whether `<RelatedArticles>` below the card also surfaces the preview/recap (likely de-duplicated by the page query, but settled when implementation lands)
- `<MatchStatusBadge>` Direction-D audit — 6.B.d5
- Cross-cutting components (`<MatchTeaser>` / `<MatchResultRow>` / `<MatchStripClient>`) — 6.B.d6 / d7 / d8
