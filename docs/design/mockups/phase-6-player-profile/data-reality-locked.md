# 6.d0 · Data-reality reconciliation — LOCKED

**Decision:** Variant **C — Full §5.3**, locked 2026-05-21 as Phase 6.A's
upper-bound scope target.

**Caveat (owner direction, same session):** "C but some sections might get
eliminated." Each per-element drill round (6.d1 → 6.dN) carries an explicit
"drop this section entirely" option as a 4th variant alongside the three
treatment options. Sections survive only when both their visual treatment AND
their data commitment justify themselves on first-pass review.

Reference: `6d0-data-reality/round-1-data-reality-comparisons.html` Variant C.
Companion: `6d0-data-reality/compare.md`.

## What this locks

| Decision                           | Locked value                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Page section ceiling               | 8 sections matching §5.3: Hero, Stats, Bio, CareerLog, RecentMatches, Quotes + top/bottom MatchStrip chrome                  |
| Hero `NIEUW` badge                 | In scope — requires new schema field `player.firstTeamSince: date`                                                           |
| `CareerLogTable`                   | In scope — requires new schema field `player.careerLog: array<{yearRange, clubName, clubCrest?, role, badge?}>`              |
| `RecentMatchesGrid`                | In scope — requires new BFF endpoint `/matches/player/{id}/recent` joining PSD games with per-player goal/assist attribution |
| Editorial commitment               | ~12h to populate 24 A-ploeg players (career log entries) + club crest asset gathering                                        |
| BFF commitment                     | New endpoint design + per-player goal-attribution logic on top of existing PSD `goalsScored` event arrays                    |
| Sections subject to per-drill drop | All 6 content sections (Hero / Stats / Bio / CareerLog / RecentMatches / Quotes). Chrome (MatchStrip) is fixed.              |

## What this does NOT lock

- **Per-element treatments** — each section's visual design opens a separate
  drill round (6.d1, 6.d2, …). Each round shows 3 treatment variants + a
  4th "drop this section entirely" variant.
- **Build slice shape** — single PR vs. component-first vs. vertical slice.
  Re-asked after per-element drills complete and surviving sections are known
  (grill Q8).
- **Schema migration timing** — alongside the page PR or as prep PR. Decided
  during PRD writing.
- **BFF endpoint shape** — request/response contract for
  `/matches/player/{id}/recent`. Will be detailed in the PRD; not part of any
  design drill round.

## Drill queue (under upper-bound C)

The brief queued Q1 → Q2 originally. Variant C expands the queue. Order
preserves the brief's first two, then adds the rest in render-order so each
later drill can see what came before it. Every round carries the "drop section"
4th variant.

1. **6.d1 — Player-name typography rhythm** (Hero, brief Q1)
2. **6.d2 — Hero PlayerFigure treatment** (Hero, illustrated fallback policy)
3. **6.d3 — Hero NIEUW badge trigger + position** (Hero, only relevant if Hero survives)
4. **6.d4 — StatsStrip — which 5 numbers + label voice** (Stats)
5. **6.d5 — BioBlock PullQuote sourcing logic** (Bio)
6. **6.d6 — CareerLogTable anchor-row emphasis** (CareerLog, brief Q2)
7. **6.d7 — RecentMatchesGrid card treatment** (RecentMatches)
8. **6.d8 — QuotesBlock pairing + sourcing** (Quotes)

Each round produces its own `6dN-<topic>/round-N-<topic>-comparisons.html` +
`compare.md`, and a sibling `<topic>-locked.md` at this folder's root once
decided.

## Downstream doc-audit obligations (after all per-element drills lock)

Per `[[feedback_audit_equals_grep]]` and `[[project_phase_6_prep_notes]]`:

- `docs/plans/2026-04-27-redesign-master-design.md` §5.3 — trim to surviving
  sections only.
- `docs/plans/2026-04-27-redesign-master-design.md` §5.4 — "one EditorialHero"
  thesis already wrong (sibling hero components locked earlier this session);
  needs rewriting.
- `docs/design/phase-6-player-profile-brief.md` — append "Scope locked
  2026-05-21" section pointing at this file.
- `[[project_phase_6_prep_notes]]` memory — update with locked scope.

These updates run as the final step of Phase 6.A PRD writing, not eagerly per
drill round.
