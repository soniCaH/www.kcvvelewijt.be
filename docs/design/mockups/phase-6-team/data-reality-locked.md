# 6.C.d0 · Team listing + detail — Data Reality LOCKED

**Drill round 0.** First drill of the Phase 6.C (team) design series.
Establishes which data the redesign can render today so subsequent visual
drills compose within a known data-truth box. Mirrors 6.A.d0 / 6.B.d0.

**Status:** LOCKED 2026-05-28. Variant C — design within today's data; auto-hide
sections whose data is absent (esp. youth teams). No new BFF endpoints; no new
editorial backlog beyond what already exists on the `team` document.

---

## Surfaces

- Listing: `/ploegen` — ISR 1h. Today renders legacy `InteriorPageHero` +
  `TeamFeaturedCard` + `YouthTeamsDirectory`.
- Detail: `/ploegen/[slug]` — ISR 1h. Today renders legacy `<TeamDetail>` with
  tabs (Info / Spelers / Wedstrijden / Klassement).

## Data source map

### Sanity `team` document (`TEAM_BY_SLUG_QUERY`)

| Field | Type | Availability | Notes |
| --- | --- | --- | --- |
| `name` | string | ✓ (PSD-synced) | e.g. "KCVV Elewijt" |
| `slug` | slug | ✓ | route key |
| `age` | string | ✓ (PSD-synced) | "A", "U17", … |
| `division` / `divisionFull` | string | ✓ editorial | "3NA" / "Eerste Elftal A – 3e Nat. A" |
| `season` | string | ✓ (PSD-synced) | "25/26" |
| `tagline` | string | optional editorial | |
| `body` | Portable Text | optional editorial | team description |
| `contactInfo` | Portable Text | optional editorial | |
| `teamImage` | image (hotspot) | optional | squad photo |
| `trainingSchedule` | `trainingSession[]` | optional editorial | day/time/location/type |
| `players` | ref[] → player | ✓ (PSD-synced) | squad (forward refs) |
| `staff` | `{ member→staffMember, role }[]` | ✓ (PSD-synced refs) | role = trainer \| afgevaardigde |

`player` fields available via the team query: `firstName`, `lastName`,
`jerseyNumber`, `keeper`, `positionPsd`, `position` (Keeper / Verdediger /
Middenvelder / Aanvaller / Speler), `psdImage` (≈90% of players) OR
`transparentImage` (editorial, rare). **Dropped in 6.A:** nationality, height,
weight — do not render.

`staffMember` fields: `firstName`, `lastName`, `functionTitle` (PSD-synced),
`photo`.

### BFF (PSD)

| Call | Returns | Availability |
| --- | --- | --- |
| `getRanking(psdId)` → `/ranking/:teamId` | `RankingEntry[]` | ✓ seniors; **empty `[]` for most youth** |
| `getMatches(psdId)` → `/matches/:teamId` | `Match[]` | ✓ seniors; **empty `[]` for most youth** |

`RankingEntry`: position, team_id, team_name, team_logo?, played, won, drawn,
lost, goals_for, goals_against, goal_difference, points, form?. The team's
**own** row already carries season W/D/L + GF/GA — so a standalone `StatsStrip`
is redundant (dropped, see decision record).

`Match` rows reuse the already-reskinned `<MatchResultRow>` (finished) /
`<MatchTeaser>` (upcoming) — no new row vocabulary needed in 6.C.

## NOT available today

- **Team-filtered sponsors** — sponsor docs don't reference teams. 6.C renders
  the **global** `<SponsorsBlock>` at the foot, not a per-team set.
- **Per-team statistics endpoint** consumed on the page — not used; the team's
  ranking row covers W/D/L + GF/GA.
- **Youth competitive data** — PSD frequently returns empty standings/schedule
  for U-teams. Those sections **auto-hide**; a U-team page can degrade to
  hero + squad + staff (+ training/body when present).

## Locked composition (direction, per decision record)

`TeamHero` → `StandingsTable` (this team highlighted) → `MatchSchedule`
(upcoming + past) → `SquadGrid` of `PlayerCard` → Staff → `team.body` /
`trainingSchedule` / `contactInfo` when present → **global** `SponsorsBlock`.
No standalone `StatsStrip`. All non-hero sections auto-hide on empty data.

**Open (this is 6.C.d1):** is the detail IA a **single-scroll** stack (6.A/6.B
precedent) or **reskinned tabs**? Resolved by the side-by-side in
`6cd1-detail-ia/`.

## Constraints inherited

- Locked palette only (cream / warm / ink / jersey-deep) — **no outcome
  colours** in standings/form. The legacy `TeamStandings` green/yellow/red W/D/L
  badges are a violation and must not carry over.
- `<PlayerCard>` composes `<PlayerFigure>` → inherits the 6.A photo treatment +
  minor-privacy rules (see `project_player_profile_all_ages`).
- Cross-age: every section answers "does this render for a U8?" — most → hide.

## Cross-references

- Decision record: `project_phase_6cde_remainder_decisions` memory + #1528.
- 6.A precedent: `docs/design/mockups/phase-6-player-profile/data-reality-locked.md`.
- 6.B precedent: `docs/design/mockups/phase-6-match-detail/data-reality-locked.md`.
