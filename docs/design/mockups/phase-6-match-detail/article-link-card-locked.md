# 6.B.d4 · `<MatchArticleLinkCard>` — LOCKED + DEFERRED

**Decision:** **Variant B — Hero-style cover card**, design locked 2026-05-22. **Implementation deferred to the post-#1470 timeline.**

The component design is settled so that when `matchPreview` / `matchRecap` article variants eventually ship (per #1470), the implementation can follow the locked spec without re-litigating visual direction. **It is NOT built in Phase 6.B implementation issues** — Phase 6.B's match-detail page renders without this card until #1470 lands.

## Why the deferral

The component **auto-hides on every match today**. No `matchPreview` / `matchRecap` articles exist in the dataset, the article schema has no `linkedMatch` field yet (the actual field name from #1470's spec — it stores the PSD match ID, not a Sanity reference, since matches aren't Sanity-managed), and #1470 (the issue that would ship both the variants and the field) is not on the near-term roadmap. Building `<MatchArticleLinkCard>` as part of Phase 6.B implementation would mean shipping dormant code: tests + Storybook + page wiring all for a branch that returns `null` 100% of the time in production.

The right move is to lock the design (so the future PR has a starting point) and skip the implementation. When #1470 lands, a follow-up issue spawns the build.

## What this locks (when it eventually ships)

| Decision | Locked value |
| --- | --- |
| Shape | Full-width `<TapedCard>` with cover image bleeding to the top edge |
| Cover image | 16:9 aspect, derived from the article's `coverImage` field via the standard Sanity image transform |
| Image bleed | Flush to the card's `border-2 border-ink` outline; 2px ink rule between image + body |
| Card rotation | Slight (~-0.3°) tilt, matching the page's editorial-paper-card vocabulary |
| Body padding | `padding-lg` (16px 18px 18px) |
| Kicker | `<MonoLabelRow>` — copy varies by state (see "Per-state behaviour" below) |
| Heading | `<EditorialHeading size="display-md">` — italic display, period suffix, pulled from the article title |
| Lead | One-line article description (max ~140 chars; the article's `excerpt` field) |
| CTA row | Mono caps `LEES HET HELE VERHAAL →` with arrow |
| Container | Centered, `max-w-[var(--container-wide)]` |
| Hover | Canonical press-down (per `[[feedback_canonical_press_down_hover]]`) — translates 1px + shadow disappears |
| New primitives | **None** — pure composition of `<TapedCard>` + `<TapedFigure>` + `<EditorialHeading>` + `<MonoLabelRow>` |

## Per-state behaviour

| Match state | Article variant linked | Kicker copy | Auto-hide rule |
| --- | --- | --- | --- |
| `scheduled` (upcoming) | `matchPreview` | `LEES DE VOORBESCHOUWING · MATCHPREVIEW` | No matching article → `null` |
| `finished` | `matchRecap` | `LEES HET VERSLAG · MATCHVERSLAG` | No matching article → `null` |
| `forfeited` / `postponed` / `stopped` | `matchRecap` if exists, otherwise `matchPreview` | "LEES OOK" (generic) | Both missing → `null` |
| Both `matchPreview` AND `matchRecap` exist on a finished match | `matchRecap` (preview is stale post-kickoff) | `LEES HET VERSLAG · MATCHVERSLAG` | n/a |

## Rejected alternatives

- **A — Compact one-line link**: rejected. Low click affordance. Hides the editorial work — the journalist's article gets less visual weight than the BFF lineup data. Owner picked B partly because B sells the article properly when it does exist.
- **C — Inline magazine banner**: rejected. Mid-weight compromise without a clear win. Square cover crop is non-standard (article covers are 16:9), and the `+1 small primitive` cost has no upside when B already composes existing parts cleanly.

## Implementation guard rails

When the follow-up PR ships (paired with #1470):

- Component file: `apps/web/src/components/match/MatchArticleLinkCard/MatchArticleLinkCard.tsx`
- Story title: `Features/Matches/MatchArticleLinkCard` with `tags: ["autodocs", "vr"]`
- Stories: one per state (Preview / Recap / Hidden) — `Hidden` ships as a blank-snapshot VR baseline mirroring how Phase 6.A's `BioBlock.Empty` story is structured
- Test coverage: auto-hide branches (no article, both articles, preview-only, recap-only) explicitly covered
- Page-level wiring: the page's GROQ query for `/wedstrijd/[matchId]` fans out to `*[_type == "article" && linkedMatch == $matchId && articleType in ["matchPreview", "matchRecap"]]` — picks one per the per-state rule above
- Auto-hide is enforced at the page level, not just inside the component (`null` is OK but Phase 6.A's `findNthPullquoteText`-style pre-compute pattern is preferred)

## Cross-references

- 6.B.d0 data reality: `data-reality-locked.md`
- 6.B.d1 page composition: `page-composition-locked.md` — `<MatchArticleLinkCard>` slot is reserved; renders nothing pre-#1470
- 6.B.d2 MatchHero lock: `matchhero-locked.md`
- 6.B.d3 lineup + events lock: `lineup-events-locked.md`
- d4 drill artifacts:
  - `6b4-article-link-card/compare.md`
  - `round-1-article-link-card-comparisons.html`
- Dependency: **#1470** (`feat(news): match preview/recap article variant`)
- Phase 5 `<NewsCard>` precedent: `apps/web/src/components/news/NewsCard/`

## Drill state after this lock

| Drill | Subject | Status |
| --- | --- | --- |
| 6.B.d0 | Data reality | ✅ LOCKED |
| 6.B.d1 | Page composition | ✅ LOCKED |
| 6.B.d2 | `<MatchHero>` shape | ✅ LOCKED |
| 6.B.d3 | `<MatchLineupSection>` + `<MatchEventsSection>` | ✅ LOCKED |
| 6.B.d4 | `<MatchArticleLinkCard>` | ✅ **LOCKED + DEFERRED to post-#1470** |
| 6.B.d5 | `<MatchStatusBadge>` Direction-D audit | next |
| 6.B.d6 | `<MatchTeaser>` reskin (default + compact) | queued — cross-cutting per #1528 |
| 6.B.d7 | `<MatchResultRow>` reskin | queued — cross-cutting per #1528 |
| 6.B.d8 | `<MatchStripClient>` audit | queued — cross-cutting per #1528 |
| 6.B.d2 round 4 | MatchHero mobile collapse | deferred to implementation kickoff |
| 6.B.d3 round 2 | Per-row visual refinements | deferred unless flagged |
