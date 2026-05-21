# 6.d7 · RecentMatchesGrid — LOCKED (dropped)

**Decision:** Variant **D — drop the section**, locked 2026-05-21.

**Owner rationale at lock time:** _"I think this might get complicated. What
if the player is in two (or more) teams?"_ The multi-team complication broke
both the team-result paths (B, C) and the composite path (B′ — proposed in
discussion, never mockup'd because of the multi-team blocker). The
canonical Variant A's per-player BFF endpoint would have absorbed the
multi-team mess server-side, but at the highest engineering cost in the
whole drill series.

References:

- `6d7-recentmatches/round-1-recentmatches-comparisons.html` Variant D
- `6d7-recentmatches/compare.md`

## What the multi-team complication actually is

KCVV's `team.players[]` reverse-references mean a single player can be
rostered to multiple teams simultaneously. Common cases:

- B-team player called up to A-team for select matches
- U21 player called up to Beloften
- U17 player promoted to U19 / U21 for tournament weeks

For any "recent matches" surface, this multiplies the complexity:

- Which team's matches? (B/C path: no clean answer without inventing a
  `player.primaryTeam` field that doesn't exist)
- Union of all teams' matches the player was active in? (B′ path: N+1
  fetches × M teams, dedupe, sort — orchestration burden)
- Server-side aggregation? (A path: highest engineering cost; only
  cleanly handles multi-team)

Combined with already-thorny per-player attendance derivation, the
section's data picture was always going to be the most expensive in
Phase 6.A. Dropping cleanly removes the burden.

## What this locks

| Decision                                       | Locked value                                                                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| RecentMatchesGrid on player profile            | Removed entirely.                                                                                                                             |
| New BFF endpoint `/matches/player/{id}/recent` | **Cancelled.** No new BFF surface.                                                                                                            |
| Per-player goal/assist attribution logic       | **Cancelled.**                                                                                                                                |
| Multi-team disambiguation                      | **Moot.** No surface needs it on this page.                                                                                                   |
| Link to team match schedules                   | Implicit — players are linked from their teams' detail pages, not the other direction. Future enhancement could add inline link, not drilled. |

## Page composition after 6.d7

```text
MatchStrip (chrome)
PlayerHero (with PlayerFigure illustration fallback)
StripedSeam
BioBlock (with bio PT pullquote decorator — first marked span)
[ QuotesBlock ? ]      ← 6.d8 last drill
MatchStrip (chrome)
SiteFooter
```

The page is now essentially **Hero + Bio** with one optional content
section remaining. This is the leanest possible composition that still
honors the "voice + identity" direction.

## Cumulative scope reduction across Phase 6.A drills

| Drill | Locked                | Scope deltas                                                                    |
| ----- | --------------------- | ------------------------------------------------------------------------------- |
| 6.d3  | NIEUW dropped         | Cancelled `firstTeamSince` schema field                                         |
| 6.d4  | StatsStrip dropped    | Removed band; `getPlayerStats` BFF call deferred                                |
| 6.d6  | CareerLog dropped     | Cancelled `careerLog[]` schema field + ~12h editorial + 10-15 crest assets      |
| 6.d7  | RecentMatches dropped | Cancelled new BFF endpoint + per-player attribution + multi-team disambiguation |

**Phase 6.A schema migrations: ZERO. BFF endpoints: ZERO. New editorial backlog: ZERO.**

The only additive is the `pullquote` Portable Text decorator on
`player.bio` (locked at 6.d5).

## Dark-band parking — now critical

Per the 6.d4 parking, the dark band aesthetic needs a home. With
RecentMatchesGrid dropped, **QuotesBlock (6.d8) is now the only remaining
candidate** — specifically the `<PullQuote tone="ink">` half of the
canonical pair. If 6.d8 also drops, the dark band is retired from the
player profile entirely. That's not a problem (the page becomes uniformly
cream / paper) but it does mean the visual interest the user explicitly
liked about the dark band lives or dies with the next drill.

## What this does NOT lock

- Whether match-attendance data is published for any KCVV team — that's a
  PSD audit question independent of this design lock
- Future re-introduction of recent matches on the player profile in a
  later phase — Phase 6.A's drop is scope-discipline, not permanent
  rejection
- Whether the player-profile page should link to team-detail's match
  schedule — could be inline CTA in BioBlock or a chrome element; not
  a design drill, handle in PRD

## Drill state after this lock

- 6.d0 — Data-reality reconciliation · LOCKED (Variant C upper-bound; schema scope empty)
- 6.d1 — Player-name typography · LOCKED (first Black + last italic)
- 6.d2 — Hero photo fallback · LOCKED (PlayerFigure illustration)
- 6.d2.a — Illustration refinement at hero scale · QUEUED
- 6.d3 — NIEUW badge · LOCKED (dropped)
- 6.d4 — StatsStrip · LOCKED (dropped; dark-band aesthetic parked)
- 6.d5 — BioBlock PullQuote sourcing · LOCKED (bio PT decorator)
- 6.d5.a — PullQuote presentation · QUEUED
- 6.d6 — CareerLog · LOCKED (dropped)
- **6.d7 — RecentMatchesGrid · LOCKED (dropped; multi-team complexity blocker)**
- 6.d8 — QuotesBlock pairing + sourcing · NEXT (last per-element drill; final home for dark band)
- 6.d9 — Cross-age section availability matrix · QUEUED
