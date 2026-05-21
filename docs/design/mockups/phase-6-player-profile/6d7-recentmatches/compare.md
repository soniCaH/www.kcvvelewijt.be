# 6.d7 · RecentMatchesGrid — primitive map

**Round 1.** Per-element drill. Canonical mockup shows four dark cards with
date · competition · scoreline · per-player goal/assist tag · venue. The
per-player attribution makes this the **most-expensive section** in Phase
6.A's drill series — cost class is BFF engineering, not editorial.

Visual artifact: `round-1-recentmatches-comparisons.html` — four variants
showing the A-team case and the youth case where the section auto-hides.

## Reference locks consumed

- `docs/design/phase-6-player-profile-brief.md` §2 "Vier wedstrijden"
- `6d0-data-reality/data-reality-locked.md` — Variant C commits to new BFF endpoint
- `6d4-statsstrip/statsstrip-locked.md` — dark-band aesthetic parked for repurpose
- `[[CLAUDE.md]]` PSD API gotchas — `goalsScored` is array of goal events; player attribution requires audit
- `[[project_player_profile_all_ages]]` — youth section auto-hides without data
- `[[feedback_design_data_audit]]` — render only fields that exist

## Variants

- **A — Canonical with per-player attribution.** New BFF endpoint
  `/matches/player/{id}/recent`. Per-player goal/assist tags. 100%
  mockup fidelity. Highest engineering cost.
- **B — Team-result cards.** Same dark 4-card grid, scoreline only
  (no per-player tags). Uses existing `/games/team` endpoint. Zero new
  BFF surface. Less personal — same matches for every team-mate.
- **C — Compact list.** Light cream-on-cream table of last 4 matches.
  Same data as B. Lowest visual weight; doesn't naturally consume the
  parked dark-band aesthetic.
- **D — Drop the section.** No recent-matches surface on the player
  profile. Team-detail page already carries match schedule + standings.
  Continues the 6.d3 / 6.d4 / 6.d6 drop-section trend.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost                                                                                       | Notes                                                                                                                                                               |
| ------- | ------- | -------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**   | 2       | High     | New BFF endpoint + per-player goal-attribution logic + new `<RecentMatchesGrid>` primitive | Highest single-section cost in Phase 6.A. PSD `goalsScored` is team-global event list; attribution requires audit + new join logic.                                 |
| **B**   | 1       | Medium   | New `<RecentMatchesGrid>` primitive composing existing match data                          | Visually identical to A; uses existing `/games/team`. Multi-team disambiguation needs PRD decision.                                                                 |
| **C**   | 1       | Low      | New `<RecentMatchesList>` primitive (or compact variant of grid)                           | Same data dependency as B but lighter visual treatment. Doesn't naturally fit the dark-band parking.                                                                |
| **D**   | 0       | Low      | None — removes the section                                                                 | Largest BFF scope-cut of any drill. Page composition drops to Hero → BioBlock → QuotesBlock + chrome. Dark-band parking needs another home (only QuotesBlock left). |

## Cost class distinction (vs. CareerLog)

CareerLog's cost was **editorial** — humans typing career rows for 24
players. RecentMatches' cost is **engineering** — a developer building a
new endpoint and audit/derivation logic against PSD's team-global goal
arrays. Different work streams; different bottlenecks; different risk
profiles.

| Bottleneck             | CareerLog (dropped)                   | RecentMatches                                |
| ---------------------- | ------------------------------------- | -------------------------------------------- |
| Editorial              | ~12h population + ongoing maintenance | None                                         |
| Engineering            | Schema migration only                 | New BFF endpoint + attribution logic + tests |
| Asset sourcing         | 10-15 external crests                 | None                                         |
| Ongoing data freshness | Per-player updates as careers evolve  | Automatic via PSD sync                       |

## Multi-team disambiguation (B / C / A all face this)

Players appearing in multiple teams (e.g. A-Ploeg + Beloften) have matches
in multiple feeds. PRD must decide:

- Show union (all teams) → may exceed 4 cards
- Show primary team only (based on `team.priority` field if added)
- Show last 4 across all teams

Whatever PRD picks, A's per-player attribution sidesteps the issue
(matches are tied to the player, not to a team selector).

## Dark-band repurpose home

The parked 6.d4 dark band needs a surface. If 6.d7 locks A or B, the
dark band naturally lives here (both render ink-toned cards). If C
locks, the dark band could promote the list to "compact ink list" but
that's a stretch. If D locks, only QuotesBlock (6.d8) remains as a
candidate.

This is now an interlocked question with 6.d8 — whichever section gets
the dark register defines where the band lives on the page.

## Cross-age behaviour

- **A**: hides when per-player attribution unavailable (most youth)
- **B / C**: hides when team has no published matches (depends on PSD
  per-division coverage — audit needed)
- **D**: never renders

PSD per-division coverage is an open question that affects B/C
viability for youth. Audit deferred to PRD writing.

## Things this drill does NOT decide

- Multi-team disambiguation logic (PRD)
- Number of cards / rows (assume 4 throughout this drill)
- Whether the dark band lives here or in QuotesBlock (interlocked with 6.d8)
- Tag taxonomy for variant A (goal / assist / clean-sheet / minutes) —
  PRD writing
- Editorial override for "featured 4" matches per player (brief flagged
  as deferred to implementation-time per
  `[[project_phase_5_6_design_in_flight]]`)

## Drop-section escape hatch

Variant D is the explicit drop-section variant per the 6.d0 lock. If D
wins:

- Page composition becomes the leanest possible: Hero + BioBlock + (QuotesBlock?) + chrome
- Zero new BFF endpoints for Phase 6.A
- Dark-band parking moves entirely to QuotesBlock (6.d8) or is dropped
- Cumulative drop-section count for Phase 6.A: **4** (NIEUW, StatsStrip,
  CareerLog, RecentMatches)
