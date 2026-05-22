# 6.B.d7 · `<MatchResultRow>` — LOCKED

**Decision:** **Variant A — Mini-teaser row**, locked 2026-05-22.

`<MatchResultRow>` reskinned as a scaled-down `<MatchTeaser>` (per d6 A2-italic vocabulary). Date stub + body + result pill, all in row height. Strongest vocabulary coherence with the rest of the page; same ticket-card family across hero → teaser → row.

## What this locks

| Decision | Locked value |
| --- | --- |
| Overall shape | Single row card — `border-2 ink + shadow-paper-sm + bg-cream`. Three zones: left stub (~64px) → body (teams + score) → result pill at the right edge |
| Stub | `bg-cream-soft`, centred. Display-big date number (18px, weight 900) over italic display month label ("jun", lowercase Dutch). 2px dashed ink right border. No time in the stub. |
| Body | Mono kicker dropped (date stamp is the marker; rows live under date-grouped section headers when needed). 3-col grid: home (`1fr`) / score (`auto`) / away (`1fr`). Italic display team names; KCVV gets `font-weight: 600`. Score `display-big` weight 900, 16px |
| Result pill | At the row end, separated by a 1px dashed ink-muted vertical divider. 22×22 square pill. Three variants: W (jersey green bg, ink text) / G (cream-soft bg, ink border, ink text) / L (warm bg, cream text — per round 2 deferral) |
| Theme | Light only (dark dropped — single consumer `<TeamSchedule>` is light) |
| Hover | Canonical press-down per `[[feedback_canonical_press_down_hover]]` |
| Link wrap | Whole row is a `<Link>` to `/wedstrijd/[matchId]` (matches today's behaviour) |
| New primitives | **None** — pure composition of d6 vocabulary at row scale |

## Composition

```text
┌─────────────────────────────────────────────────────────────┐
│ ┌────┐ ╎ [K] KCVV Elewijt    3 — 1    RC Mechelen [M] ╎ W │
│ │ 14 │ ╎                                              ╎    │
│ │ jun│ ╎                                              ╎    │
│ └────┘ ╎                                              ╎    │
│ (stub) (dashed)        (body)                  (dashed)(pill)
└─────────────────────────────────────────────────────────────┘
```

## Result pill colours

| Result | Pill | Notes |
| --- | --- | --- |
| **W** (winst) | `bg-jersey text-ink` (effectively `pill-jersey`) | Existing MonoLabel pill variant |
| **G** (gelijkspel / draw) | `bg-cream-soft text-ink border border-ink` | Neutral; matches MatchStatusBadge T3's cream-deep no-game tier in spirit |
| **L** (verlies) | `bg-warm text-cream` | Round 2 sub-decision; warm reads as "abnormal but match concluded". Owner can downgrade to a bordered-cream pill if warm feels too loud across many losses in a season |

## Rejected alternatives

- **B — Result-anchored row**: rejected. Diverges from the ticket-card vocabulary; introducing a third card shape for the same domain (hero / teaser / row) when A delivers vocabulary coherence at near-equivalent space efficiency. Row-bg tint risked a "traffic light" feel across a difficult season.

## Knock-on resolutions

**`<MatchResultRow>` is rewritten — not migrated.** The pre-redesign component (`apps/web/src/components/match/MatchResultRow/MatchResultRow.tsx`) uses retired tokens (`kcvv-green-bright`, `kcvv-success`, `kcvv-alert`, `kcvv-warning`, `rounded-card`) + a result-coloured left border that conflicts with the 2px ink card frame. The implementation ticket replaces the component file entirely; downstream consumer `<TeamSchedule>` keeps the same API and shouldn't need changes beyond a re-test against the new visual.

**`getResultColor` utility stays as-is.** `apps/web/src/lib/utils/match-display.ts:getResultColor` still works — it returns `"win" | "loss" | "draw"`, which maps to the new pill variants in the rewrite.

**Storybook + VR coverage required.** New stories per result type (W / G / L) + per state (finished, edge states via MatchStatusBadge); meta `tags: ["autodocs", "vr"]`.

**Mobile collapse.** Rows stack naturally in the parent `<TeamSchedule>` — no row-internal collapse needed (the stub stays ~64px even on mobile; teams abbreviate via CSS truncation, score stays prominent).

## Cross-references

- 6.B.d2 MatchHero lock — ticket-card vocabulary source
- 6.B.d5 MatchStatusBadge lock — corner stamp integration (rows render the badge in the same corner-stamp slot when applicable)
- 6.B.d6 MatchTeaser lock — A2-italic source for the scaled-down stub + body
- d7 drill artifacts:
  - `6b7-matchresultrow/compare.md`
  - `round-1-matchresultrow-comparisons.html` (A vs B)
- Existing component to rewrite: `apps/web/src/components/match/MatchResultRow/`
- Sole consumer: `apps/web/src/components/team/TeamSchedule/` (in `<TeamDetail>` at `/ploegen/[slug]`)

## Drill state after this lock — ALL DRILLS COMPLETE

| Drill | Subject | Status |
| --- | --- | --- |
| 6.B.d0 | Data reality | ✅ LOCKED |
| 6.B.d1 | Page composition | ✅ LOCKED |
| 6.B.d2 | `<MatchHero>` shape | ✅ LOCKED |
| 6.B.d3 | `<MatchLineupSection>` + `<MatchEventsSection>` | ✅ LOCKED |
| 6.B.d4 | `<MatchArticleLinkCard>` | ✅ LOCKED (build deferred to post-#1470) |
| 6.B.d5 | `<MatchStatusBadge>` Direction-D + tint | ✅ LOCKED |
| 6.B.d6 | `<MatchTeaser>` | ✅ LOCKED (default only; compact + MatchesSlider retired) |
| 6.B.d7 | `<MatchResultRow>` | ✅ **LOCKED (this doc — Variant A mini-teaser row)** |
| 6.B.d8 | `<MatchStrip>` audit | ✅ LOCKED (no-op — Phase 3.C lock authoritative) |
| 6.B.d2 round 4 | MatchHero mobile collapse | deferred to implementation kickoff |
| 6.B.d3 round 2 | Per-row visual refinements | deferred unless flagged |

**Next step: `/write-a-prd`** consolidating all 8 drill decisions + the BFF schema delta + the cleanup deliverables into `docs/prd/redesign-phase-6b-match-detail.md`. Then `/prd-to-issues` to spawn the implementation tickets.
