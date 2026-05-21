# 6.d2 · Hero photo fallback — LOCKED (with open sub-drill)

**Decision:** Variant **C — PlayerFigure illustration**, locked 2026-05-21.

References:

- `6d2-hero-figure-fallback/round-1-hero-figure-fallback-comparisons.html` Variant C
- `6d2-hero-figure-fallback/round-2-B-vs-C-zoom.html` — zoom comparison that clarified the choice
- Production primitive: `apps/web/src/components/design-system/PlayerFigure/PlayerFigure.tsx`
- Canonical SVG paths: `apps/web/src/components/design-system/_jersey-paths.ts`

## What this locks

| Decision                              | Locked value                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero present-state                    | `<TapedFigure aspect="portrait-3-4">` with newsprint filter + paper grain + `<MonoLabel>NIEUW</MonoLabel>` corner badge (from brief, unchanged)              |
| Hero fallback when `psdImage` missing | The canonical `<PlayerFigure>` illustration (head + torso + V-neck + 4 vertical stripes) rendered inside the same `<TapedFigure>` frame                      |
| Identity hook (fallback case)         | None on the figure itself — identity carried by the `#` numeral + name in the left column. All fallback profiles render visually identical figures.          |
| Vocabulary delta                      | Zero — reuses Phase 4.5 locked illustration paths from `_jersey-paths.ts`                                                                                    |
| Hybrid policy                         | Per `[[feedback_playerfigure_no_hybrid]]` — illustration replaces the photo entirely. Never a photo face inside the drawn body. Either / or, never combined. |

## Open sub-drill: 6.d2.a — illustration refinement at hero scale

Owner direction at lock time: _"C is better, but the illustration might need updates."_

The canonical `<PlayerFigure>` illustration has been ship-tested at avatar
scale (PullQuote subjects, related-article subject chips). Its scale at the
**hero** is materially larger — `aspect: portrait-3-4`, max-width ~280px on
desktop vs ~60–80px at avatar. At hero scale the figure may read too sparse,
too geometric, or insufficiently distinctive against the dense paper /
newsprint hero composition.

Defer the illustration-art drill until **after** the first per-element drills
that establish the hero context (6.d3 NIEUW badge → 6.d4 StatsStrip →
6.d5 BioBlock). At that point, render the canonical figure against the
locked Maxim composition at production scale to see what it actually looks
like, then drill any refinements as 6.d2.a:

- Tier-A — keep as-is (head + torso + V-neck + 4 stripes)
- Tier-B — add small detailing (shoulder seams, hem line, sleeve cuffs)
- Tier-C — change proportions / silhouette (e.g. wider torso, fuller head)
- Tier-D — replace with a different illustration vocabulary entirely

This sub-drill is **scoped to the hero use case only**. The avatar-scale use
of `<PlayerFigure>` stays locked unless 6.d2.a's outcome cascades back —
that decision is itself part of the 6.d2.a drill.

## Downstream consequences

- Sanity schema is unchanged — illustration state is purely a runtime
  fallback based on `player.psdImage` presence.
- BFF is unchanged.
- `<JerseyShirt number>` prop extension (Variant B's vocabulary delta) is
  **not** required. Defer or drop entirely.
- `<TapedFigure>` frame stays unchanged — only the inner content swaps.
- `<PlayerHero>` (Phase 6.A new component) renders one of two inner
  contents based on `player.psdImage` — branch logic mirrors the existing
  `<PlayerFigure>` component.

## What this does NOT lock

- The illustration art itself at hero scale — **6.d2.a** (queued, open).
- The NIEUW badge trigger logic + placement — **6.d3** (next).
- Whether `<JerseyShirt>` ever grows a `number` prop for other surfaces — out of scope.
- Cascade decisions if the canonical illustration refines later (e.g. does
  the avatar use update too?) — decided as part of 6.d2.a.

## Drill state after this lock

- 6.d0 — Data-reality reconciliation · LOCKED (Variant C upper-bound)
- 6.d1 — Player-name typography · LOCKED (Variant C — first Black + last italic)
- **6.d2 — Hero photo fallback · LOCKED (Variant C — PlayerFigure illustration)**
- 6.d2.a — Illustration refinement at hero scale · QUEUED (after 6.d3 / 6.d4 / 6.d5)
- 6.d3 — Hero NIEUW badge trigger + placement · NEXT
- 6.d4 — StatsStrip numbers + label voice · pending
- 6.d5 — BioBlock PullQuote sourcing logic · pending
- 6.d6 — CareerLogTable anchor-row emphasis (brief Q2) · pending
- 6.d7 — RecentMatchesGrid card treatment · pending
- 6.d8 — QuotesBlock pairing + sourcing · pending
