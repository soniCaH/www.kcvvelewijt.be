# 6.d6 · CareerLogTable — LOCKED (dropped)

**Decision:** Variant **D — drop CareerLog entirely**, locked 2026-05-21.

**Owner rationale at lock time:** _"this is a LOT of editorial work for all
players, and we dont always know. I would lean towards DROP here as well."_

Two distinct concerns combined:

1. **Editorial cost** — ~12h to populate 24 A-team players, plus ongoing
   maintenance as careers evolve. Phase 6.A's editorial backlog drops
   from ~12h to **zero** with this lock.
2. **Data uncertainty** — we don't reliably know every player's full
   career history. Populating it with gaps would either fabricate
   content (violates `[[feedback_design_data_audit]]`) or render visibly
   incomplete logs that look broken.

References:

- `6d6-careerlog/round-1-careerlog-comparisons.html` Variant D
- `6d6-careerlog/compare.md`

## What this locks

| Decision                     | Locked value                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| CareerLog on player profile  | Removed entirely. No section between BioBlock and (potential) RecentMatchesGrid.                                                            |
| `player.careerLog[]` schema  | **Cancelled.** No migration. No new field.                                                                                                  |
| Club-crest asset sourcing    | **Cancelled.** No external club crest assets needed for Phase 6.A.                                                                          |
| Editorial workload           | **Phase 6.A drops to zero editorial backlog for the page itself** (bio decorator usage during writing is per-bio editorial, not a backlog). |
| Cross-age symmetry           | Improves further. Page no longer has any A-team-specific narrative content.                                                                 |
| `<CareerLogTable>` primitive | Not built. Net-new vocabulary cancelled.                                                                                                    |

## Cumulative scope reduction across Phase 6.A drills

Tracking the running impact of drop-section decisions:

| Drill | Locked             | Scope deltas                                                                                      |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------- |
| 6.d3  | NIEUW dropped      | Cancelled `player.firstTeamSince` schema migration                                                |
| 6.d4  | StatsStrip dropped | Removed Strip from page composition; `getPlayerStats` BFF call deferred to PRD                    |
| 6.d6  | CareerLog dropped  | Cancelled `player.careerLog[]` schema migration; cancelled ~12h editorial; cancelled crest assets |

**Phase 6.A schema migrations: ZERO.** The only schema additive remaining
is the `pullquote` Portable Text decorator added to `player.bio` (6.d5),
which is additive-decorator-only — no new top-level fields.

## Page composition after 6.d6

Remaining surviving sections:

```text
MatchStrip (chrome)
PlayerHero (with PlayerFigure illustration fallback)
StripedSeam
BioBlock (with bio PT pullquote decorator)
[ RecentMatchesGrid ? ]   ← 6.d7 next
[ QuotesBlock ? ]         ← 6.d8 last
MatchStrip (chrome)
SiteFooter
```

The page is becoming a **voice + identity** page rather than a
biographical ledger. That's a coherent editorial direction.

## What this does NOT lock

- The "logboek" word usage elsewhere on the site (it might surface in
  staff bios, history page, etc.) — out of scope for Phase 6
- Future re-introduction of a career-log surface in Phase 7 (club /
  organigram) or beyond — Phase 6.A's drop is not a permanent rejection,
  just a scope-discipline call for this surface in this phase
- Whether the BioBlock paragraph should be longer to compensate for the
  dropped section's lost editorial content — editorial decision, not
  a design drill

## Trend across drills

Drop-section pattern emerging across drills:

- Sections that require **new BFF work** or **per-player editorial** got
  dropped (StatsStrip last-result variant rejected; CareerLog dropped)
- Sections that **gracefully consume existing data** got kept (PlayerHero,
  BioBlock)
- Sections with **fabricated chrome** got dropped (NIEUW badge)
- The principle: keep things we have data for, drop things we don't

This pattern strongly predicts the 6.d7 RecentMatchesGrid lock — which
requires a new BFF endpoint with per-player goal/assist attribution.
Anticipate D unless a low-data alternative surfaces.

## Drill state after this lock

- 6.d0 — Data-reality reconciliation · LOCKED (C upper-bound; schema scope **now empty**)
- 6.d1 — Player-name typography · LOCKED (first Black + last italic)
- 6.d2 — Hero photo fallback · LOCKED (PlayerFigure illustration)
- 6.d2.a — Illustration refinement at hero scale · QUEUED
- 6.d3 — NIEUW badge · LOCKED (dropped)
- 6.d4 — StatsStrip · LOCKED (dropped; dark-band aesthetic parked)
- 6.d5 — BioBlock PullQuote sourcing · LOCKED (bio PT decorator)
- 6.d5.a — PullQuote presentation · QUEUED
- **6.d6 — CareerLog · LOCKED (dropped; biggest scope win in series)**
- 6.d7 — RecentMatchesGrid card treatment · NEXT (anticipated D-leaning per the trend)
- 6.d8 — QuotesBlock pairing + sourcing · pending
- 6.d9 — Cross-age section availability matrix · QUEUED
