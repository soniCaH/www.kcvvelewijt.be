# 6.B.d3 · `<MatchLineupSection>` + `<MatchEventsSection>` — LOCKED

**Decision:** **Variant A — Classic separate sections**, locked 2026-05-22.

Two distinct sections render below the hero on **finished** matches. Both auto-hide for upcoming matches per the 6.B.d1 page-composition lock.

1. **`<MatchLineupSection>`** — kicker `OPSTELLINGEN` + heading "Wie er stond." + two-column home/away rosters wrapping the existing `<MatchLineup>` primitive.
2. **`<StripedSeam>`** between the two sections.
3. **`<MatchEventsSection>`** — kicker `WEDSTRIJDVERLOOP` + heading "Hoe het ging." + single timeline ordered by minute, wrapping the existing `<MatchEvents>` primitive.

Zero new design-system primitives. Both sections are thin chrome wrappers around their existing per-row primitives.

## What this locks

| Decision | Locked value |
| --- | --- |
| Section count | Two separate sections (lineup + events) |
| Section order | Lineup first, then events |
| Inter-section divider | `<StripedSeam colorPair="ink-cream" height="md" />` |
| Lineup layout | Two columns (home left, away right), each = list of player rows |
| Events layout | Single timeline ordered chronologically by minute, scorer's team shown as a mono caps label on the right |
| Sub presentation | Below starters, separated by a `BANK` divider line + section heading style |
| Per-row primitive | `<MatchLineup>` + `<MatchEvents>` (existing) — section wrappers add chrome, not row geometry |
| New primitives | **None** (round 1 mockup uses existing per-row vocabulary; round 2 may refine if owner wants) |
| Auto-hide rule | Each section returns `null` when its data is empty (typically upcoming matches) |

## Composition

```text
─── MatchHero (locked in 6.B.d2) ─────────────────────────────────

* OPSTELLINGEN
Wie er stond.

┌────────────────────────────┬────────────────────────────┐
│ KCVV ELEWIJT               │ RC MECHELEN                │
├────────────────────────────┼────────────────────────────┤
│  1  Ben Lievens     (GK)   │  1  Stijn Vandenberg (GK)  │
│  2  Niels Vermeulen        │  3  Kevin Smets   🟨 28'   │
│  4  Jonas De Smet          │  …                         │
│  5  Wim Verhoeven    [C]   │ 10  Robbie Vermeiren  [C]  │
│  6  Maxim Breugelmans 🟨   │  …                         │
│  7  Lars De Vos    ⚽ 12'  │                            │
│  …                         │                            │
├── BANK ────────────────────┼── BANK ────────────────────┤
│ 16  Pieter De Bondt ⇅ 71'  │  2  Ruben Pauwels          │
│  …                         │  …                         │
└────────────────────────────┴────────────────────────────┘

═══════════════════════════════════════════════════════════════
                   ⌷⌷⌷ StripedSeam ⌷⌷⌷
═══════════════════════════════════════════════════════════════

* WEDSTRIJDVERLOOP
Hoe het ging.

  12'    ⚽   Lars De Vos                          KCVV
  28'    🟨   Kevin Smets                          MECH
  45+2'  ⚽   Jens Vermeulen (strafschop)          KCVV
  56'    ⚽   Tom Janssens                         MECH
  67'    🟨   Maxim Breugelmans                    KCVV
  71'    ⇅   Pieter De Bondt ⇆ Lars De Vos       KCVV
  78'    ⚽   Maxim Breugelmans                    KCVV

─── <MatchArticleLinkCard> (drilled in 6.B.d4) ──────────────────
─── RelatedArticles ─────────────────────────────────────────────
─── FooterSafeArea ──────────────────────────────────────────────
```

### `<MatchLineupSection>` chrome

| Element | Treatment |
| --- | --- |
| Kicker | `<MonoLabelRow>` `OPSTELLINGEN` (10px mono caps, 0.18em tracking, `* ` prefix) |
| Heading | `<EditorialHeading size="display-md">Wie er stond.</EditorialHeading>` — italic display, period suffix |
| Container | Centered, `max-w-[var(--container-wide)]`, paper bg (`bg-cream`) |
| Grid | `grid-template-columns: 1fr 1fr` desktop; stack to single column at < 768px (mobile collapse follows existing `<MatchLineup>` rules) |
| Team column header | Mono caps team name (10px, 0.16em tracking, opacity 0.7) above the player rows |
| Per-row | `<MatchLineup>` row primitive: number badge + italic display name + status icons inline (captain `[C]`, card `🟨/🟥`, minute mark `⚽ 12'`) |
| Subs separator | "BANK" divider line (1px ink top border + mono caps label) separates starters from subs |
| Goalkeeper distinction | Number badge gets `bg-warm` instead of `bg-ink` for keepers — see round-1 mockup; round 2 may refine |

### `<MatchEventsSection>` chrome

| Element | Treatment |
| --- | --- |
| Kicker | `<MonoLabelRow>` `WEDSTRIJDVERLOOP` |
| Heading | `<EditorialHeading size="display-md">Hoe het ging.</EditorialHeading>` |
| Container | Centered, `max-w-[var(--container-wide)]`, paper bg |
| Row layout | 4-column grid: minute (36px) / event glyph (22px) / player name (`1fr`) / team mono label (auto, right-aligned) |
| Minute typography | `font-display-big`, weight 900, ~18px, letter-spacing -0.025em |
| Event glyph | 22px square — goal `⚽` on jersey-green bg; yellow card `🟨`; red card `🟥`; substitution `⇅` on cream-deep bg |
| Player name | `font-display` italic, ~15px — for substitutions: `<in> ⇆ <out>` form |
| Team label | Mono caps right-aligned ("KCVV" / "MECH" or whatever opponent's short code is) |
| Row separator | 1px dashed cream-deep between rows |
| Sort | Chronological by `minute` ascending; first-half stoppage time (`45+2'`) sorts before `46'` |

## Rejected alternatives

### B — Combined Matchverslag interleaved (3-column)

Rejected for three reasons:
1. **+1 new primitive** (`<MatchTimelineGrid>` with per-minute anchoring + side-aware player labels) — implementation cost is the highest of the three options
2. **Mobile collapse is hard** — three columns must reflow to a single column with events interleaved by minute, which is its own design problem requiring a dedicated drill
3. The "redesign distinctiveness" win doesn't justify the cost when Variant A already meets the "matchverslag" reading intent via the kicker + heading

The variant remains valuable design reference and is documented in the round-1 mockup. A future drill can revisit if the page feels under-distinctive after implementation.

### C — Events first, lineup collapsible

Rejected for two reasons:
1. **Default-collapsing the lineup hides a feature most readers expect to see** — the editorial intent of "matchverslag" includes the rosters, and hiding them by default reads as a UX anti-pattern (not a deliberate choice)
2. **Lose per-player event context** — the lineup row showing "Lars De Vos ⚽ 12'" + "subbed off ⇅ 71'" is a useful at-a-glance, which is broken when the events live in a separate top block

The events-first reading order has merit on mobile where vertical space is tight — round 2 could revisit a mobile-specific reordering if needed, but the desktop default stays lineup-first per A.

## Knock-on resolutions

**`<MatchLineup>` + `<MatchEvents>` primitives stay as-is.** The redesign work happens at the SECTION wrapper layer, not the row-rendering layer. Per-row visual refinements (number badge style, captain glyph treatment, card icon set) are deferred to a round-2 drill IF owner pushback during implementation flags any of them.

**`<MatchDetailView>` retires alongside `<MatchHeader>`.** The current `MatchDetailView` composes header + lineup + events in a single component; the new shape splits these into hero + two sections at the page level. Implementation issue covers the migration.

**Goalkeeper visual distinction.** Round-1 mockup uses `bg-warm` for the keeper number badge to differentiate from outfielders. This is a small treatment decision that ships as-is unless flagged.

**Mobile collapse plan.** Both sections stack to single column at < 768px (the team columns sit one above the other). The events table stays as-is — minute / glyph / player / team grid scales down without restructuring. Deferred to implementation-time sanity check, not a separate drill.

## Cross-references

- 6.B.d0 data reality: `docs/design/mockups/phase-6-match-detail/data-reality-locked.md`
- 6.B.d1 page composition: `docs/design/mockups/phase-6-match-detail/page-composition-locked.md`
- 6.B.d2 MatchHero lock: `docs/design/mockups/phase-6-match-detail/matchhero-locked.md`
- d3 drill artifacts:
  - `docs/design/mockups/phase-6-match-detail/6b3-lineup-events/compare.md`
  - `round-1-lineup-events-comparisons.html`
- Existing primitives wrapped:
  - `apps/web/src/components/match/MatchLineup/`
  - `apps/web/src/components/match/MatchEvents/`

## Drill state after this lock

| Drill | Subject | Status |
| --- | --- | --- |
| 6.B.d0 | Data reality | ✅ LOCKED |
| 6.B.d1 | Page composition | ✅ LOCKED |
| 6.B.d2 | `<MatchHero>` shape | ✅ LOCKED |
| 6.B.d3 | `<MatchLineupSection>` + `<MatchEventsSection>` | ✅ **LOCKED (this doc — Variant A)** |
| 6.B.d4 | `<MatchArticleLinkCard>` | next |
| 6.B.d5 | `<MatchStatusBadge>` Direction-D audit | queued |
| 6.B.d6 | `<MatchTeaser>` reskin (default + compact) | queued — cross-cutting per #1528 |
| 6.B.d7 | `<MatchResultRow>` reskin | queued — cross-cutting per #1528 |
| 6.B.d8 | `<MatchStripClient>` audit | queued — cross-cutting per #1528 |
| 6.B.d2 round 4 | MatchHero mobile collapse | deferred to implementation kickoff |
| 6.B.d3 round 2 | Per-row visual refinements | deferred unless flagged |
