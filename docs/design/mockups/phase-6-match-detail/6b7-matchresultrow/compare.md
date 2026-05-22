# 6.B.d7 · `<MatchResultRow>` — primitive comparison map

**Round 1.** Reskin of the finished-match table row used by `<TeamSchedule>` on `<TeamDetail>` (`/ploegen/[slug]`). Current implementation predates Phase 4.5 — uses pre-redesign tokens (`kcvv-green-bright`, `kcvv-success`, `kcvv-alert`, `rounded-card`) and doesn't compose with the editorial paper-card vocabulary locked in d2/d6.

Visual artifact: `round-1-matchresultrow-comparisons.html` — two structural shapes. The decision space is narrower than d6: owner consistently picked ticket-card descendants (d2 H1, d6 A2), so this round contrasts a **ticket-card row variant** against a **result-anchored row variant** rather than re-exploring the whole shape space.

## Consumer reality

Single non-legacy consumer: `<TeamSchedule>` inside `<TeamDetail>` on `/ploegen/[slug]`. Light theme. The pre-redesign component supports a dark theme; in the redesigned `<TeamDetail>` (Phase 6.C scope) the dark theme has no consumer either — same logic that retired `<MatchTeaser variant="compact">` in d6. **Dark theme is dropped** in this drill; if Phase 6.C surfaces a dark consumer it spawns a follow-up.

## Reference locks consumed

- `matchhero-locked.md` (d2) — ticket-card stub vocabulary
- `matchteaser-locked.md` (d6) — A2-italic + display-big date number + italic month label
- `matchstatusbadge-locked.md` (d5) — corner stamp integration
- Phase 2 Direction D — paper chrome (`border-2 ink + shadow-paper-sm + bg-cream`)

## Variants

- **A — Mini-teaser row (ticket-card descendant).** Same stub + body shape as `<MatchTeaser>` from d6, scaled DOWN to row height. Date stub on the left (~64px), teams + score in the body. Result indicated by a small coloured pill at the row end (W/L/G — same vocabulary as today, restyled to MonoLabel pill). Strongest visual coherence with the rest of the page.
- **B — Result-anchored row.** Date column → home (shield + name) → score (big display-big) → away (name + shield) → result indicator pill at the far right. No ticket-card stub. The score IS the visual anchor; result colour reinforces it via subtle row-bg tint (win = cream, draw = cream-soft, loss = warm-tint). Reads as a results table.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost | Notes |
| --- | --- | --- | --- | --- |
| **A — Mini-teaser row** | 0 | Low | Pure composition of d6 vocabulary at row scale | Vocabulary coherence; reads as "fixture card at row scale". |
| **B — Result-anchored row** | 0 | Low | New layout but composes existing primitives | More table-like; score is the dominant element. |

## Result-pill vocabulary

Both variants render a small W/L/G result indicator. Today's pre-redesign component uses bg-coloured spans with green/red/yellow tints. The reskin uses MonoLabel pill variants:

| Result | Today (pre-redesign) | Reskinned |
| --- | --- | --- |
| **W** (win) | `bg-kcvv-green-bright/15 text-kcvv-green-bright` | `<MonoLabel variant="pill-jersey">W</MonoLabel>` |
| **G** (draw / gelijkspel) | `bg-yellow-500/15 text-yellow-400` | `<MonoLabel variant="pill-cream">G</MonoLabel>` |
| **L** (loss) | `bg-red-500/15 text-red-400` | New `pill-warm` variant OR a bordered-cream pill — minor decision deferred to round 2 |

The result-coloured left border in today's component is **dropped** — it doesn't compose with the 2px ink card frame used elsewhere. Result lives in the pill at the row end.

## Things this drill does NOT decide

- Pill colour for "L" — round 2 sub-decision (either a new `pill-warm` variant or a bordered-cream pill matching MatchStatusBadge's STOP tier from d5)
- Light-only theme behaviour (dropped from scope; revisit if Phase 6.C surfaces a dark consumer)
- Row-bg tint by result (variant B floats this; if A wins, the tint is moot)
- Mobile collapse — both variants stack naturally; locked at implementation time
