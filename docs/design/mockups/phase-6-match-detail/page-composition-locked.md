# 6.B.d1 · Page Composition — LOCKED

**Decision:** Variant **A — Shared shell, per-section auto-hide**, locked 2026-05-22.

The match-detail page renders one composition for both states. `<MatchHero>` is state-aware; structural sections (`<MatchLineupSection>`, `<MatchEventsSection>`, `<MatchArticleLinkCard>`) auto-hide when their data isn't available. Mirrors the Phase 6.A pattern (BioBlock / QuotesBlock auto-hide when bio lacks the right span marks).

The "hard fork" Variant B (separate UpcomingMatchPage / FinishedMatchPage components) is **rejected** in favour of one composition — reduces code duplication and matches the BioBlock / QuotesBlock vocabulary established in 6.A.

The "minimal" Variant C (push lineup + events to the article system) is **rejected** in favour of keeping lineup + events on `/wedstrijd/[matchId]` — they're already-available BFF data and provide value independent of editorial coverage.

## What this locks

| Decision | Locked value |
| --- | --- |
| Page shape | One composition; sections auto-hide based on data availability |
| State branching | Hero is state-aware (one `<MatchHero state="upcoming\|finished" />`); body sections gate on data, not state |
| MatchStrip placement | Top only (`<MatchStripSlot />` inline at the top, mirroring `/spelers/[slug]`'s post-6.A resolution) |
| RelatedArticles | Slot reserved below the body sections; **DEFERRED to post-#1470** for the same reason as `<MatchArticleLinkCard>` — without the `linkedMatch` field that #1470 introduces on the article schema, no structured article↔match linkage exists in the dataset and the query would always return zero rows |

## Page composition

```text
SiteHeader                                (from layout)
MatchStripSlot                            (top — inline, like /spelers/[slug])
<MatchHero state="upcoming|finished">     (state-aware; never auto-hides)
StripedSeam
<MatchLineupSection>                      (auto-hides if no lineup → typically upcoming)
<MatchEventsSection>                      (auto-hides if no events → typically upcoming)
<MatchArticleLinkCard>                    (DEFERRED to post-#1470; slot reserved, renders nothing in v1)
RelatedArticles                           (DEFERRED to post-#1470; depends on the linkedMatch field that #1470 introduces — no article↔match linkage exists in the dataset until then)
FooterSafeArea
```

### Per-state render shape

**Upcoming** (status = `scheduled`):
- Hero (upcoming variant — score region shows kickoff time or "vs")
- `<MatchArticleLinkCard>` if a `matchPreview` article exists for this match
- `RelatedArticles`
- (Lineup + Events auto-hidden — no data)

**Finished** (status = `finished`):
- Hero (finished variant — score region shows final score + status badge)
- `<MatchLineupSection>` (BFF surfaces lineup for finished matches)
- `<MatchEventsSection>` (BFF surfaces events for finished matches)
- `<MatchArticleLinkCard>` if a `matchRecap` article exists for this match
- `RelatedArticles`

**Edge states** (`forfeited` / `postponed` / `stopped`):
- Hero renders the finished variant with the appropriate `MatchStatus` badge ("FF" / "AFG" / "STOP")
- Lineup / events typically empty → auto-hide
- ArticleLinkCard renders if any related article exists

## MatchStrip placement rationale

Top-only mounting matches the precedent set by /spelers/[slug] (Phase 6.A) — the strip gives the visitor next-fixture orientation before they engage with detail content. Bottom mounting (originally hinted at in the 6.d8 player-profile spec) is rejected as visual noise the rest of the site doesn't repeat. The Phase 3.C lock's "detail pages omit" rule is opted out of for `/wedstrijd/[matchId]` and `/spelers/[slug]` only — both are match-context surfaces where the next-fixture strip enhances rather than distracts.

## Knock-on resolutions

**`<MatchHero>` is a new design-system component** introduced by this lock. It supersedes the existing `<MatchHeader>` consumed by `MatchDetailView`. `<MatchHeader>` retirement is in scope for 6.B; the per-component drill (6.B.d2) settles the visual treatment.

**`<MatchArticleLinkCard>` is a new design-system component** introduced by this lock. Its visual treatment is settled in 6.B.d4 (Variant B — hero-style cover card). The component is **OPTIONAL** — when no `matchPreview` / `matchRecap` article exists, it returns `null` (auto-hide).

**Implementation deferred per the d4 lock.** The `linkedMatch` field on the article schema (which is how an article points at a match per #1470's spec) doesn't exist today. No `matchPreview` / `matchRecap` articles exist either. Both `<MatchArticleLinkCard>` AND a match-filtered `<RelatedArticles>` would auto-hide on every match in v1 — they're shipped as dormant code or skipped entirely. The card is **not** built in Phase 6.B implementation tickets — the slot in the page composition is reserved but renders nothing pre-#1470. A follow-up issue spawned alongside #1470 implements both pieces (the link card + the related-articles match query) to the locked designs.

**`<MatchLineupSection>` and `<MatchEventsSection>`** are new section-level wrappers around the existing `<MatchLineup>` + `<MatchEvents>` primitives, adding redesign chrome (kicker, heading, striped seam, container). The wrapped primitives keep their tested behaviour.

## Cross-references

- Phase 6.B.d0 data-reality lock: `docs/design/mockups/phase-6-match-detail/data-reality-locked.md`
- Phase 6.A precedent (one-composition-with-auto-hide): `docs/design/mockups/phase-6-player-profile/quotesblock-locked.md`
- Phase 3.C MatchStrip rule: `docs/design/mockups/phase-3-c-header-and-matchstrip/matchstrip-locked.md`
- Article variant dependency: #1470

## Drill state after this lock

| Drill | Subject | Status |
| --- | --- | --- |
| 6.B.d0 | Data reality | ✅ LOCKED |
| 6.B.d1 | Page composition | ✅ **LOCKED (this doc)** |
| 6.B.d2 | `<MatchHero>` shape (upcoming + finished variants) | round 1 in-flight |
| 6.B.d3 | `<MatchLineupSection>` + `<MatchEventsSection>` | queued |
| 6.B.d4 | `<MatchArticleLinkCard>` | queued |
| 6.B.d5 | `<MatchStatusBadge>` Direction-D audit | queued |
| 6.B.d6 | `<MatchTeaser>` reskin (default + compact) | queued — cross-cutting per #1528 |
| 6.B.d7 | `<MatchResultRow>` reskin | queued — cross-cutting per #1528 |
| 6.B.d8 | `<MatchStripClient>` audit | queued — cross-cutting per #1528 |
