# 6.B.d2 · `<MatchHero>` — LOCKED

**Decision:** Round 2 **H1 (Ticket-card)** + Round 3 **T2 (dashed-only separator)**, locked 2026-05-22.

The hero is a single `<TapedCard>` split into two zones by a 2px dashed ink divider:

- **Left zone** (~110px wide): "ticket stub" with the big display date, kickoff time, and venue. Cream-soft tint background.
- **Right zone**: editorial body — mono kicker → teams + score row → competition meta row.

No perforation punch-out circles. Zero new design-system primitives — pure composition + one-line `border-right: 2px dashed var(--color-ink)` rule.

## What this locks

| Decision | Locked value |
| --- | --- |
| Overall shape | Single `<TapedCard>` hero, two zones via internal grid |
| Left zone (stub) | ~110px wide, `bg="cream-soft"`, display-big date + time + venue (mono caps) |
| Right zone (body) | `bg="cream"`, kicker + teams/score + competition meta |
| Divider between zones | 2px dashed ink line (`border-right` on the stub element) — **no** punch-out circles |
| States | Same shape upcoming + finished; only score region + kicker copy swap |
| Status badge placement | Finished state only; renders as a corner stamp top-right, slightly overlapping the card top border |
| New primitives introduced | **None** |
| Photo treatment | None — per 6.B.d0 data-reality lock, no per-match photo source exists |

## Composition

```text
┌──────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ╎  * VOORBESCHOUWING / MATCHVERSLAG            │
│ │  ZA 14   │ ╎                                              │
│ │  JUN     │ ╎  [K] KCVV Elewijt  vs / 3 — 1  RC Mech [M]   │
│ │  14:30   │ ╎                                              │
│ │          │ ╎  ──────────────────────────────────────────  │
│ │ SPORTPARK│ ╎  3E PROVINCIALE A · KCVV-A · '26/'27         │
│ │ ELEWIJT  │ ╎                                              │
│ └──────────┘ ╎                                              │
│   (stub)    (dashed)        (body)                          │
└──────────────────────────────────────────────────────────────┘
                                              [FT stamp on finished only]
```

### Stub (left zone)

| Element | Typography | Notes |
| --- | --- | --- |
| Date | `font-display-big`, weight 900, 20–24px, line-height 1, two lines (`ZA 14 / JUN`) | Upright Black display — same weight family as `<EditorialHeading size="display-2xl">` (no font-subset re-cut needed) |
| Time | `font-mono`, 14px, letter-spacing 0.06em | Single line e.g. `14:30` |
| Venue | `font-mono` caps, 9.5px, opacity 0.75, line-height 1.4 | Two lines OK |
| Background | `bg-cream-soft` (var `--color-cream-soft`) | Distinguishes from body zone visually |
| Divider | `border-right: 2px dashed var(--color-ink)` | The only chrome between zones |

### Body (right zone)

| Element | Typography | Notes |
| --- | --- | --- |
| Kicker | `<MonoLabelRow>` style, 10px, letter-spacing 0.18em, prefix `* ` | Copy = `VOORBESCHOUWING` (upcoming) or `MATCHVERSLAG` (finished); may append competition name |
| Teams row | 3-column grid (home `1fr` / score `auto` / away `1fr`) | Each team = `<shield>` + italic display name; away mirrors home (reverse direction, right-aligned) |
| Score region | `font-display-big` weight 900, 34px when numeric; italic display 22px lowercase when "vs" | The only visually state-aware element inside the hero |
| Competition meta | `font-mono` caps, 10.5px, separated by `·` dots; sits above a 1px ink top border | One line e.g. `3E PROVINCIALE A · KCVV-A · '26/'27` |

### State-aware element table

| Element | Upcoming (`scheduled`) | Finished (`finished`) |
| --- | --- | --- |
| Kicker text | `VOORBESCHOUWING` | `MATCHVERSLAG` |
| Score region | `vs` (italic display lowercase) | `3 — 1` (display-big) |
| Status badge | None | Corner stamp (`FT` / `FF` / `AFG` / `STOP`) top-right |
| Everything else | Identical | Identical |

Edge states (`forfeited` / `postponed` / `stopped`) render as finished with the appropriate status badge — they're not separate visual treatments.

## Rejected alternatives

### Round 1 (structural shape)

- **B — Ticket-stub band** (full-bleed dark band): rejected for being too heavy chrome. Owner picked A but flagged B's ticket motif as desirable → resolved by round 2 hybrids.
- **C — Two-team polaroids**: eliminated entirely by owner. Shield quality varies (PSD-sourced), and polaroid-scale promotion exposed that variance.

### Round 2 (A+B hybrid concepts)

- **H2 — Card + matchday stamp**: rejected. Stamp competed with the corner status badge for top-right attention; status-inline-in-meta-row workaround wasn't worth the complexity.
- **H3 — Card with ticket-footer**: rejected. Ticket motif at the bottom edge was less prominent than H1's left-stub treatment.

### Round 3 (separator treatment)

- **T1 — Full perforations**: rejected. Punch-out corner circles added fiddly geometry to maintain across breakpoints + competed with the outer card frame's ink border. The ticket-stub idiom comes through enough via the dashed line + display-date typography + cream-soft tint.
- **T3 — Subtle perforations**: rejected. Compromise position with no compelling argument over T2's full elimination of the circles.

## Knock-on resolutions

**`<MatchHeader>` retires when `<MatchHero>` ships.** The existing `<MatchHeader>` consumed by `MatchDetailView` is superseded. Implementation issue covers the migration (likely: a separate cleanup ticket spawned by `/prd-to-issues` after the PRD is written).

**`<MatchStatusBadge>` Direction-D audit (6.B.d5)** is independent — the badge already exists; d5 just confirms it aligns with the Phase 4.5/5 Direction D treatment for use as the corner stamp in `<MatchHero>` (and elsewhere).

**Mobile collapse (round 4, deferred):**

At narrow widths (<~640px) the two-zone grid stacks vertically: stub becomes a top row spanning the full card width, body sits below, divider rotates from vertical-right to horizontal-bottom (`border-bottom: 2px dashed ink` on the stub). Status badge stays top-right.

This is straightforward but worth a small round-4 sanity-check mockup before implementation — deferred to a sub-drill when 6.B.d2 implementation kicks off, not blocking the rest of the design series.

## Cross-references

- 6.B.d0 data reality: `docs/design/mockups/phase-6-match-detail/data-reality-locked.md`
- 6.B.d1 page composition: `docs/design/mockups/phase-6-match-detail/page-composition-locked.md`
- d2 drill artifacts:
  - `docs/design/mockups/phase-6-match-detail/6b2-matchhero/compare.md`
  - `round-1-matchhero-comparisons.html`
  - `round-2-matchhero-comparisons.html`
  - `round-3-matchhero-comparisons.html`
- Phase 5 `<EditorialHero>` vocabulary (for primitive references): `apps/web/src/components/article/EditorialHero/EditorialHero.tsx`
- Phase 4.5 `<TapedCard>` precedent

## Drill state after this lock

| Drill | Subject | Status |
| --- | --- | --- |
| 6.B.d0 | Data reality | ✅ LOCKED |
| 6.B.d1 | Page composition | ✅ LOCKED |
| 6.B.d2 | `<MatchHero>` shape | ✅ **LOCKED (this doc — H1 + T2)** |
| 6.B.d3 | `<MatchLineupSection>` + `<MatchEventsSection>` visual treatment | next |
| 6.B.d4 | `<MatchArticleLinkCard>` | queued |
| 6.B.d5 | `<MatchStatusBadge>` Direction-D audit | queued |
| 6.B.d6 | `<MatchTeaser>` reskin (default + compact) | queued — cross-cutting per #1528 |
| 6.B.d7 | `<MatchResultRow>` reskin | queued — cross-cutting per #1528 |
| 6.B.d8 | `<MatchStripClient>` audit | queued — cross-cutting per #1528 |
| 6.B.d2 round 4 | Mobile collapse (deferred to implementation kickoff) | queued |
