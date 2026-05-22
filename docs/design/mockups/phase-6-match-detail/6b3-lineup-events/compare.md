# 6.B.d3 · `<MatchLineupSection>` + `<MatchEventsSection>` — primitive comparison map

**Round 1.** First visual drill of the body content that renders below the hero on **finished** matches. Both sections auto-hide for upcoming matches per the 6.B.d1 page-composition lock (no lineup / no events data → no section).

Visual artifact: `round-1-lineup-events-comparisons.html` — three variants of the lineup + events presentation. Same synthetic match data across all three (KCVV 3 — 1 RC Mechelen with realistic event timeline + 11-player rosters + 4 subs per team).

## Reference locks consumed

- `data-reality-locked.md` (6.B.d0) — BFF surfaces `lineup.{home, away}` (each = array of `MatchLineupPlayer` with name + number + status + card + minutesPlayed) and `events` (array of `MatchEvent` with minute + type + team + player)
- `page-composition-locked.md` (6.B.d1) — both sections wrap existing `<MatchLineup>` / `<MatchEvents>` primitives in redesign chrome; per-section auto-hide
- `matchhero-locked.md` (6.B.d2) — H1 + T2 hero shape sets the page's editorial-card vocabulary; body sections compose below
- Phase 5 `<QASection>` precedent — section-level wrapper around existing per-row primitives with kicker + heading + container

## Variants

- **A — Classic separate sections.** Two blocks. First: "Opstellingen." with home + away as two side-by-side columns (mirrors `<MatchLineup>`'s current shape). Second: "Wedstrijdverloop." as a single timeline ordered by minute, scorer's name aligned to the correct team side. `<StripedSeam>` between them. Most conservative: maps 1:1 onto existing components, lowest implementation cost.
- **B — Combined "Matchverslag" interleaved.** One section, heading "Matchverslag." Three columns: home lineup | events timeline | away lineup. Goals + cards stamp into the middle column at their minute, with the player name on the correct side. Most info-dense; readers see lineup + when each player acted in a single eye-sweep. Highest implementation cost (3-column-with-anchored-events layout) + hard mobile collapse.
- **C — Events first, lineup collapsible.** Two blocks but reordered. First: a compact "Doelpunten + kaarten" summary at the top — most readers want this. Second: "Volledige opstelling." below, possibly with a default-collapsed `<details>` toggle. Optimises for the typical reading flow (scan the goals → optionally dig into the roster).

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost | Notes |
| ------- | ------- | -------- | ---- | ----- |
| **A** | 0 | Low | Pure composition of `<MatchLineup>` + `<MatchEvents>` + section-level `<EditorialHeading>` + `<StripedSeam>` | Each section is a thin wrapper around its existing primitive. Lowest implementation cost. Most conventional layout. |
| **B** | 1 | High | New `<MatchTimelineGrid>` primitive (3-col layout with per-minute event anchoring + side-aware player labels) | Visually striking + highly informative. Significant implementation work — anchor math + mobile collapse story are both non-trivial. |
| **C** | 0 (with native `<details>`) or 1 (with custom expand/collapse) | Medium | Composition with reordering + collapse-toggle decision | Saves vertical space; matches reading flow. Collapse mechanism needs a sub-decision (native `<details>` accessibility vs custom drawer). |

## Reading-order trade-off

| Variant | What the reader sees first | When that's useful |
| --- | --- | --- |
| A | Full home + away lineups (top-left of the body) | Reader wants to know who played |
| B | All three columns at once (lineup + events) | Reader wants the whole story in one image (info-dense, "matchverslag" mood) |
| C | Goals + cards summary (events first) | Reader wants the scoreboard story, may or may not care about the roster |

## Cross-state behaviour

All three variants render **only on finished matches**. Per the d1 lock, both sections auto-hide when their data is empty (typical for upcoming matches — PSD doesn't surface rosters until kickoff). The drill assumes finished as the rendering case; the auto-hide branch is structural, not visual.

## Things this drill does NOT decide

- Per-row visual treatment of individual lineup players (number badge style, captain glyph, card icon styling) — round 2 of d3 if the chosen variant needs refinement
- Per-event visual treatment (goal icon, card icon, substitution arrows) — round 2 of d3
- `<MatchArticleLinkCard>` — 6.B.d4
- `<MatchStatusBadge>` — 6.B.d5
- Tables vs cards for the lineup rows — folded into the chosen variant; not a separate decision
- Goalkeeper vs outfield visual distinction — assumed to follow the per-row treatment decided in round 2
