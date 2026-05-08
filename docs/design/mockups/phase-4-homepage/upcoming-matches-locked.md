# Phase 4 · `<UpcomingMatches>` — Locked

**Locked 2026-05-07 across rounds 6 (superseded), 6a, 6b.**
**Renamed from `<ScheduleStandingsBlock>` to `<UpcomingMatches>`.**

## What changed vs the original Phase 4 issue

Issue #1526 originally listed `<ScheduleStandingsBlock>` with both schedule and standings as
tabs. Round 6a (scope) revealed a fundamental mismatch: schedule across all KCVV teams paired
with standings for one team is incoherent. Resolved with **S.4 — drop standings entirely**:

- Section becomes single-purpose `<UpcomingMatches>`.
- Standings live only on `/ranking` (separate page, unchanged).
- No tabs (Round 6's L.2 lock superseded).
- Issue #1526 AC list needs updating before PRD lands.

## Composition

```text
<UpcomingMatches>                                // server component shell
  <SectionHeader title="Komende wedstrijden">
  <UpcomingMatchesClient initialMatches={Match[]}>  // "use client" for expand state
    <ul>
      <li> // row × 5 collapsed, all upcoming when expanded
        <Link href="/match/{id}">
          <span class="when"> day · time </span>
          <span class="matchup"> {home} — {away} </span>
          <span class="meta"> {team_label} · {competition} </span>
          <span class="badge">{is_home ? "THUIS" : "UIT"}</span>
    </ul>
    {totalUpcoming > 5 && !expanded && (
      <button>Toon alle {N} wedstrijden ↓</button>
    )}
    {expanded && (
      <Link href="/kalender">Volledige kalender →</Link>
    )}
```

## Data flow

| Aspect | Value | Source |
| --- | --- | --- |
| Source endpoint | `bff.getNextMatches()` | Already used by today's homepage; same call |
| Filter | None — all KCVV teams across competitions | Per S.4 lock (community schedule scope) |
| Sort | `date asc` (chronological) | BFF default |
| Default count | 5 | Round 6b D.5 lock |
| Expand trigger | `totalUpcoming > 5` | Hide button if ≤ 5 upcoming |
| Expanded view | All upcoming matches in the same chronological list | No grouping |
| `/kalender` link | Visible only when expanded | Round 6b D.5 lock |
| Empty state (0 upcoming) | Return null (entire section hidden) | Same convention as NewsGrid E.1 |
| Per-row click target | Whole row → `Link` to `/match/{id}` | Standard match-detail route |
| KCVV team highlight | KCVV team name rendered with `font-weight: 700` per team-side (home or away) | Comparison via `home_team.id === 1235 \|\| away_team.id === 1235` |
| Home / away badge | THUIS (jersey-deep bg) or UIT (ink bg), monospace caps | Match `is_home` field |

## Locked decisions

| Round | Decision | Rationale |
| --- | --- | --- |
| 6 | ~~L.2 tabs~~ → **superseded** | Round 6a dropped one of the two tabs; tabs no longer needed |
| 6a | **S.4 · Drop standings, schedule-only** | Mismatch between all-team schedule and single-team standings; resolved by removing standings |
| 6b | **D.5 · 5 default + inline expand to all + /kalender link visible only when expanded** | User-specified hybrid pattern |

## Rotation + hover + paper treatment

- Section container is a `<TapedCard>` with `rotation="b"` (subtle -0.25°) — single anchor card.
- Schedule rows are inside the card; rows do not individually rotate.
- Each row is a `<Link>` with the canonical press-down hover applied to the row itself
  (not the card). Per `feedback_canonical_press_down_hover`.
- Expand button uses press-down hover too. Stamped paper button.
- `/kalender` link (post-expand) is plain text with `↗` arrow indicator.

## Mobile

Mobile (<640px): same row format. Day/time stacks above teams instead of left-of. Badge stays
right-aligned. Expand button grows to full width.

## VR baseline contract

- Story: `Home/UpcomingMatches/Default5` (5 upcoming, collapsed)
- Story: `Home/UpcomingMatches/ExactlyFive` (5 upcoming, expand button hidden)
- Story: `Home/UpcomingMatches/SparseUnder5` (3 upcoming, no expand button)
- Story: `Home/UpcomingMatches/Empty` (0 upcoming, returns null)
- Expanded state covered by Storybook controls; the expand interaction is captured by component
  test (Vitest) rather than VR (which captures static frames).

## Open questions deferred

- Whether expansion animation uses CSS height-transition or pop-in (no transition). Default:
  pop-in (no animation). Reduces complexity.
- Whether the count badge ("Toon alle 12 wedstrijden") shows team count or match count. Match count.
- Future enhancement: filter pills per division (deferred — not Phase 4).
