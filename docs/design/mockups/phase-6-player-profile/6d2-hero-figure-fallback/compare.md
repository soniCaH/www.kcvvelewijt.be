# 6.d2 · Hero photo fallback — primitive map

**Round 1.** Per-element drill. The brief locks the present-state hero photo
treatment as `<TapedFigure aspect="portrait-3-4">` with newsprint filter +
paper grain + NIEUW corner. This drill picks the fallback treatment when
`player.psdImage` is missing — roughly 10% of any 24-man squad.

Visual artifact: `round-1-hero-figure-fallback-comparisons.html` — four
variants showing the locked present-state on top + the proposed fallback below.

## Reference locks consumed

- `docs/design/phase-6-player-profile-brief.md` §2 "Header as poster" — hero
  uses `<TapedFigure>` rectangular, not `<PlayerFigure>` avatar
- `6d0-data-reality/data-reality-locked.md` — Hero is a surviving section
- `6d1-name-typography/name-typography-locked.md` — Variant C name rhythm
- `[[feedback_subject_photo_fallback]]` — ~90% rectangular psdImage, ~10% missing
- `[[feedback_playerfigure_no_hybrid]]` — illustration only, never photo+drawing hybrid
- `[[project_playerfigure_illustration_canonical]]` — locked canonical illustration
- `[[project_jersey_illustration_vocabulary]]` — two-pass print, jersey-deep
  underprint + ink overprint + ink stripes
- `[[feedback_reuse_approved_primitives]]` — variants must map back to source primitives

## Variants

- **A — Monogram.** Initials in oversized italic Black inside the same taped
  frame. Honest about missing data; reads as a placeholder. Zero vocabulary
  delta.
- **B — JerseyShirt.** The Phase 4.5 locked `<JerseyShirt>` illustration with
  the player's number screen-printed onto it. Adds a `number` prop to the
  primitive — trivial SVG text addition.
- **C — PlayerFigure illustration.** The canonical
  `<PlayerFigure>` polaroid-with-drawn-figure used as avatar elsewhere.
  Reopens the brief's "not PlayerFigure" distinction (which only applied
  when psdImage was assumed present).
- **D — Drop the figure.** Hero never shows a figure on any profile. Left
  column expands to single-column with larger numeral + name. Strongest
  break from the canonical Maxim mockup; 4th drop-section variant per the
  6.d0 lock.

## Vocabulary deltas summary

| Variant | Δ count | Severity | Cost                                                                                                     | Notes                                                                                                                                          |
| ------- | ------- | -------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**   | 0       | Low      | Pure composition — `<TapedFigure>` frame with display-italic text as inner.                              | Cheapest. Quietest. Honest.                                                                                                                    |
| **B**   | 1       | Low      | Add `number` prop to `<JerseyShirt>` so the number screen-prints onto the SVG.                           | All jersey illustrations site-wide could grow this prop. Already-locked illustration vocabulary stays intact.                                  |
| **C**   | 0       | Low      | Reuses locked canonical `<PlayerFigure>` illustration as the inner content of the `<TapedFigure>` frame. | Reopens the brief's "hero is not PlayerFigure" note — which assumed psdImage was always present. Distinct from the avatar use of PlayerFigure. |
| **D**   | 0       | Low      | Grid-template change only — left column spans full width. NIEUW badge needs a new home.                  | The badge re-home decision becomes a sub-drill if D wins.                                                                                      |

## Use sites consuming this vocabulary (downstream)

- `<PlayerHero>` (this page, Phase 6.A)
- `<PlayerCard>` in `<SquadGrid>` (Phase 6.B team detail) — same fallback
  logic at smaller scale
- Search-results `<PlayerCard>` — same composition
- `<EditorialHero variant="transfer">` — already ships with a similar
  `<PlayerFigure>` slot; whatever locks here informs how transfer hero
  handles missing photo too

## Things this drill does NOT decide

- The **present state** image treatment (locked in brief: newsprint filter +
  paper grain + portrait-3-4 aspect + NIEUW corner)
- Whether `<JerseyShirt>` grows a `number` prop unconditionally OR only in
  the hero context (PRD decision)
- The NIEUW badge trigger logic and placement — drill 6.d3
- How `<SquadGrid>` handles the fallback at smaller card scale — Phase 6.B
- What renders if BOTH `psdImage` AND `transparentImage` are present (today
  the page uses one; ordering audit deferred)

## Drop-section escape hatch

This drill carries the 4th drop-section variant (D) per the 6.d0 lock. If D
locks, downstream consequences:

- The `<TapedFigure>` import from `<PlayerHero>` disappears
- NIEUW badge home becomes a sub-drill of 6.d3 (since the badge can no
  longer pin to the figure's corner)
- Mockup fidelity vs retro-terrace-fanzine drops to ~60%
- Page becomes uniform across all 24 players regardless of psdImage state
