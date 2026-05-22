# 6.B.d6 · `<MatchTeaser>` — primitive comparison map

**Round 1.** The most cross-cutting drill in Phase 6.B. `<MatchTeaser>` is consumed by `<MatchesSlider>` (homepage), `<CalendarMonth>`, sidebar widgets, recent-matches grids on player profiles, and the slider stories at `HorizontalSlider.stories.tsx`. Two variants today: `default` and `compact`. Both in scope per Phase 6 epic #1528.

Visual artifact: `round-1-matchteaser-comparisons.html` — three structural shapes, each showing **default + compact size side-by-side** in the same panel so the relationship between sizes is judged together. Same finished match across all variants (KCVV 3 — 1 RC Mech, KCVV-home).

Theme (light vs dark), states (upcoming / edge) and per-status badge integration are settled in round 2 after the structural shape locks.

## Reference locks consumed

- `matchhero-locked.md` (6.B.d2) — H1 + T2 ticket-card sets the page-level match-card vocabulary; teaser should be a smaller relative
- `matchstatusbadge-locked.md` (6.B.d5) — `<MatchStatusBadge>` is the corner stamp; teaser mounts it for edge states
- `lineup-events-locked.md` (6.B.d3) — wraps existing primitives; teaser already exists and gets reskinned (no greenfield rebuild)
- Phase 4.5 R10 card structure — flush-edge cards + outer `<TapedCard>` + 1px ink rule between zones
- The `HorizontalSlider.stories.tsx` PR #1594 inline mock — starting reference, NOT a contract (per #1528 explicit note)

## Variants

- **A — Mini-hero (ticket-card descendant).** Apply d2's ticket-card shape at teaser scale. Left stub (~80px) with the big display date + kickoff time. Right body with teams + score, mono caps. Same dashed-divider chrome as `<MatchHero>` (no perforations per d2 T2). Most vocabulary-consistent with the page hero.
- **B — Vertical stacked card.** Date kicker on top, teams stacked vertically (home above away) with score on the right column, venue/competition mono row at the bottom. Different shape from the hero but matchday-card-flavored. Maps naturally to a slider card aspect ratio (taller than wide).
- **C — Horizontal fixture row.** Date | home shield + name | score | away name + shield | venue. Reads like a fixture-list row. Most compact, most list-friendly — but loses the matchday-card identity at default size.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost | Notes |
| --- | --- | --- | --- | --- |
| **A** | 0 | Low | Reuses d2's ticket-card layout (stub + body + dashed divider); just smaller | Strongest visual coherence with `<MatchHero>`. Same component family reads up + down the size scale. |
| **B** | 0 | Low | Composes `<TapedCard>` + stacked team rows + `<NumberDisplay>` score | Slider-natural aspect ratio. Differentiates from hero (intentional — hero is the page anchor, teaser is the navigation). |
| **C** | 0 | Low | Pure horizontal row layout | Most space-efficient. Compact variant becomes trivial — just shrink the heights. Loses card identity though; reads as a table row, not a teaser. |

## Default + compact relationship

Each variant must scale **down** cleanly to a compact size used by `<CalendarMonth>` rows and tight sidebar contexts. Per epic, compact stays a separate variant — not a CSS media-query collapse. So compact has its own layout decisions, but it should be a clear shrink of the default.

| Variant | Default → Compact relationship |
| --- | --- |
| **A — Mini-hero** | Stub width shrinks from ~80px → ~64px; team names abbreviate (e.g. "KCVV Elewijt" → "KCVV E."); score size drops; venue line dropped |
| **B — Vertical stacked** | Team rows tighten; score column narrows; venue/competition row dropped entirely; minimum height ~60% of default |
| **C — Horizontal row** | Already row-shaped — compact is a height + padding shrink only. Trivially smaller. |

## Highlight + theme caveats (deferred to round 2)

- **Highlight rule:** the KCVV team gets visually emphasised (italic display, jersey-deep tint, or a side stripe). All three variants support this — the exact treatment is round 2.
- **Light vs dark theme:** consumers like `MatchesSlider` (homepage) need a dark theme for the ink-band placement. Round 2 mockup renders the chosen shape in both themes.
- **Edge states** (FF / PP / CANC / STOP): all three variants render `<MatchStatusBadge>` per d5; placement on the teaser is round 2.

## Cross-cutting consumer audit

| Consumer | Surface | Currently uses | Implication for the chosen shape |
| --- | --- | --- | --- |
| `<MatchesSlider>` (homepage) | Dark ink band | `<MatchTeaser theme="dark" variant="default">` | Variant A's stub doesn't darken-friendly without thinking about ticket-stub tint reversal; B + C cleaner under dark |
| `<CalendarMonth>` | Light cream rows | `<MatchTeaser variant="compact">` | C's row layout is the natural fit; A + B work but compact-shrink is more invasive |
| Sidebar widgets / recent-matches grids on player profiles | Light cream cards | `<MatchTeaser variant="default">` | All three work; A reinforces the page hero on player profiles; B + C feel more like a generic card |
| `HorizontalSlider.stories.tsx` inline mock | Storybook only | The PR-#1594 mock | Migrate the stories to render the real component once d6 locks; delete the inline mock per #1528 follow-up cleanup |

## Things this drill does NOT decide

- Highlight treatment (round 2)
- Light vs dark theme (round 2)
- Edge-state visual layout (round 2)
- Score row typography sizing — flows from the chosen shape; locked in round 2
- The `HorizontalSlider.stories.tsx` mock migration — separate cleanup ticket per #1528
- Mobile collapse — teasers already work on mobile via stacking; tightened in round 2 if needed
