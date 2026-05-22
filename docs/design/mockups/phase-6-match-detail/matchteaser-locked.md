# 6.B.d6 · `<MatchTeaser>` — LOCKED + scope slim-down

**Decision:** **Variant A2-italic** (mini-hero ticket-card descendant, date-only stub, italic-display month label) locked 2026-05-22. **Scope slimmed**: only the `default` variant ships. The `compact` variant is **retired** alongside `<MatchesSlider>` (both have zero active production consumers since Phase 4.B.2 retired `<MatchesSliderSection>` from the homepage in favour of `<UpcomingMatches>`).

## Why the slim-down

The Phase 6 epic (#1528) listed both `default` and `compact` variants as in-scope cross-cutting, written before Phase 4.B.2 swapped the homepage `<MatchesSliderSection>` for `<UpcomingMatches>` (a different component that renders its own primitives directly from `<TapedCard>` + `<EditorialHeading>` + `<MonoLabel>`, not via `<MatchTeaser>`). After that swap, the actual production consumer map for `<MatchTeaser>` is:

| Consumer | Variant | Status |
| --- | --- | --- |
| `<CalendarMonth>` (day-detail list at `/kalender`) | default | ✅ Live — only real consumer |
| `<MatchesSlider>` (component file at `apps/web/src/components/match/MatchesSlider/`) | compact | 💀 Orphaned — exists but no app route mounts it |
| `<UpcomingMatches>` (new homepage block, Phase 4.B.2) | n/a | Does NOT use `<MatchTeaser>` — composes its own internal rendering |

Designing a compact variant for surfaces that don't exist is shipping dormant code. Same reasoning as the d4 article-link-card deferral (where matchPreview/matchRecap doesn't exist yet either): don't ship the design until the consumer ships.

## What this locks

### `<MatchTeaser variant="default">` (the only variant that ships)

| Decision | Locked value |
| --- | --- |
| Shape | Single card, 2 zones: left stub (~76px) + right body, divided by a 2px dashed ink line (no perforation circles — per d2 T2) |
| Left stub | `bg-cream-soft`, centred typography. Big display-big date number (30px, weight 900) + italic display month label ("juni" — lowercase, Dutch). No time in the stub. |
| Right body | `bg-cream`, mono kicker (weekday + time + venue) → teams + score → no separate competition row at default (folded into the kicker for space) |
| Kicker copy | `ZA · 14:30 · SPORTPARK ELEWIJT` — mono caps, opacity 0.6, no `* ` prefix (the stub is the dominant marker) |
| Teams row | 3-col grid (home `1fr` / score `auto` / away `1fr`), italic display, shield-left for home, shield-right for away |
| Score | `display-big` weight 900, 20px, dash separator (`3 — 1`) |
| Highlighted team | KCVV team gets `font-weight: 600` italic display — visually emphasises which side is "us" |
| Status badge | When `<MatchStatusBadge>` returns non-null (per 6.B.d5), placed as a corner stamp at top-right of the card |
| Hover | Canonical press-down per `[[feedback_canonical_press_down_hover]]` |
| Theme | Light only (no dark theme — the only consumer `<CalendarMonth>` is a light surface) |

### `<MatchTeaser variant="compact">` (RETIRED)

Component file's `variant?: "default" | "compact"` prop is **simplified to `default` only** (or the prop is dropped entirely if the API becomes uniform — flagged in the implementation issue). All `compact` story/test references retired in the cleanup.

### `<MatchesSlider>` (RETIRED — orphan code)

`apps/web/src/components/match/MatchesSlider/` is dead code after Phase 4.B.2's homepage rework. Retirement is in Phase 6.B implementation scope:

- `apps/web/src/components/match/MatchesSlider/MatchesSlider.tsx` + `.stories.tsx` + `.test.tsx` + `index.ts` → delete
- Barrel exports cleaned
- `<HorizontalSlider>` stories at `HorizontalSlider.stories.tsx` (the PR #1594 inline `MatchCard` mock) — already flagged in #1528 follow-up cleanup; not in 6.B implementation scope unless owner pulls forward

## Composition (default only)

```text
┌─────────────────────────────────────────────────────────────┐
│ ┌────────┐ ╎ * ZA · 14:30 · SPORTPARK ELEWIJT             │
│ │   14   │ ╎                                              │
│ │  juni  │ ╎ [K] KCVV Elewijt   3 — 1   RC Mechelen [M]  │
│ └────────┘ ╎                                              │
│  (stub)  (dashed)        (body)                           │
└─────────────────────────────────────────────────────────────┘
                                          ┌──── corner stamp
                                          │  (when MatchStatusBadge
                                          │   returns non-null per d5)
```

## Rejected alternatives

### Round 1 (structural shape)

- **B — Vertical stacked**: rejected. Less vocabulary coherence with `<MatchHero>`. Slider-natural aspect was the main argument; with the slider retired that argument disappears.
- **C — Horizontal fixture row**: rejected. Loses card identity; reads as a table row.

### Round 2 (A stub iterations)

- **A0 — Round 1 baseline**: rejected. "Too dense" per owner — too many info units in the narrow column.
- **A1 — Drop weekday**: rejected in favour of A2 — dropping the weekday alone didn't free enough density.
- **A3 — Wider mono date**: rejected. Loses display-big stamp identity; eats more horizontal space.

### Round 3 (A2-italic refinement)

- The "month in mono caps" variation (A2 as originally drafted): rejected. Italic display "juni" reads as more editorial, ties the stub typography back to the page hero's italic display name.
- Compact variant rendered for completeness: **retired**, not chosen — see scope slim-down above.

## Knock-on resolutions

**Phase 6.B implementation work tracked (will be spawned by `/prd-to-issues` once the PRD lands):**

1. Reskin `<MatchTeaser>` to the locked A2-italic default
2. Migrate `<CalendarMonth>` to render the new teaser (likely zero changes since the API stays the same)
3. Delete `<MatchTeaser variant="compact">` code + tests + stories
4. Delete `<MatchesSlider>` directory + tests + stories + barrel export
5. Storybook story coverage: one story per relevant state (upcoming, finished, edge — using `<MatchStatusBadge>` integration)
6. VR baselines for the new teaser stories

**`<MatchHero>` and `<MatchTeaser>` share the ticket-card vocabulary.** The hero uses the d2 ticket-card at full size; the teaser is the same shape at smaller scale with a centred date stamp. Vocabulary coherence across the page hero + the calendar fixture cards.

**No dark theme.** `<CalendarMonth>` is a light-surface consumer. If a future dark-surface consumer appears, that's a follow-up drill (round 4 of d6).

## Cross-references

- 6.B.d2 MatchHero lock: `matchhero-locked.md` — sets the ticket-card vocabulary
- 6.B.d5 MatchStatusBadge lock: `matchstatusbadge-locked.md` — corner-stamp integration
- d6 drill artifacts:
  - `6b6-matchteaser/compare.md`
  - `round-1-matchteaser-comparisons.html` (A vs B vs C)
  - `round-2-matchteaser-A-stub-iterations.html` (A0 / A1 / A2 / A3)
  - `round-3-matchteaser-A2-italic.html` (final A2-italic at default + retired compact panels)
- Phase 4.B.2 homepage rework that retired `<MatchesSliderSection>`: `<UpcomingMatches>` at `apps/web/src/components/home/UpcomingMatches/`
- Existing component (to be reskinned): `apps/web/src/components/match/MatchTeaser/`
- Dead code to be retired: `apps/web/src/components/match/MatchesSlider/`

## Drill state after this lock

| Drill | Subject | Status |
| --- | --- | --- |
| 6.B.d0 | Data reality | ✅ LOCKED |
| 6.B.d1 | Page composition | ✅ LOCKED |
| 6.B.d2 | `<MatchHero>` shape | ✅ LOCKED |
| 6.B.d3 | `<MatchLineupSection>` + `<MatchEventsSection>` | ✅ LOCKED |
| 6.B.d4 | `<MatchArticleLinkCard>` | ✅ LOCKED (build deferred to post-#1470) |
| 6.B.d5 | `<MatchStatusBadge>` Direction-D + tint | ✅ LOCKED |
| 6.B.d6 | `<MatchTeaser>` (default only; compact retired) | ✅ **LOCKED (this doc — A2-italic + scope slim-down)** |
| 6.B.d7 | `<MatchResultRow>` reskin — needs consumer audit | next |
| 6.B.d8 | `<MatchStripClient>` audit — needs consumer audit | queued |
| 6.B.d2 round 4 | MatchHero mobile collapse | deferred to implementation kickoff |
| 6.B.d3 round 2 | Per-row visual refinements | deferred unless flagged |
