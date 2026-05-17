# 5.d1 · Article header layout — primitive map

**Round 1 · v2 (vocabulary-faithful redraw).** Every visual choice in
`round-1-header-layout-comparisons.html` must map back to a primitive
already locked in Phase 3-b or Phase 4.5. Net-new vocabulary is called
out explicitly as a delta (Δ). Per `feedback_reuse_approved_primitives`.

Reference design system locks consumed here:

- Phase 3-b · `<EditorialHero variant="…" placement="detail">` (interview / announcement / transfer / event)
- Phase 4.5 R9 · photo treatment system (newsprint filter, paper grain, tape-on-card-frame)
- Phase 4.5 R10 · `<NewsCard>` flush-edge card structure (referenced for `<VerderLezenRow>`, out of scope here)
- Phase 4.5 R1 · `<EditorialHero placement="homepage">` (same shell, wrapped in `<a>` + press-up hover)

## Option-by-option vocabulary map

| Element                      | E0 (baseline)                                      | Option A — flanked                      | Option B — stacked centered             | Option C — hybrid                          | Option D — full-width spotlight (revised)               |
| ---------------------------- | -------------------------------------------------- | --------------------------------------- | --------------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Outer hero shell             | `<EditorialHeroShell>` 60/40 grid                  | **Δ** flat 3-col grid (200 / 1fr / 200) | **Δ** flex column, centered, max 28ch   | **Δ** flex column + nested 3-col flank row | **Δ** flex column (cover top, 60/40 text-below)         |
| Kicker                       | `<MonoLabel tone="ink">` row                       | `<MonoLabel tone="ink">` row            | `<MonoLabel tone="ink">` row            | `<MonoLabel tone="ink">` row               | `<MonoLabel tone="ink">` row                            |
| Title                        | `<EditorialHeading size="display-xl" italic>`      | same · centered                         | same · centered                         | same · centered                            | same · left-aligned                                     |
| Title accent decorator       | italic + jersey-deep substring (locked)            | identical                               | identical                               | identical                                  | identical                                               |
| Lead                         | `<EditorialLead>` italic display, max 60ch         | same · centered, narrower               | same · centered, narrower               | same · centered, in the flank row          | same · left-aligned, in left column                     |
| Byline / credit chips        | `<EditorialByline>` plain mono line                | byline + 2 `credit-chip`s               | byline + 2 `credit-chip`s               | byline + 2 `credit-chip`s in flank row     | `<EditorialByline>` stack in 40% right column           |
| Hero `coverImage` artefact   | `<TapedCard rot=a>` + `<TapedFigure 16:9>` (right) | **Δ** dropped from hero                 | **Δ** dropped from hero                 | **Δ** dropped from hero                    | `<TapedCard rot=a>` + `<TapedFigure 21:9>` (full-width) |
| `<TapeStrip>` count on cover | 1 (jersey, left)                                   | n/a                                     | n/a                                     | n/a                                        | **Δ** 2 (jersey-torn left + cream-straight right)       |
| Polaroid subjects            | `<SubjectsStrip>` BELOW hero (2× 3:4)              | **Δ** moved INTO hero (flanking title)  | **Δ** moved INTO hero (row below title) | **Δ** moved INTO hero (flank row)          | `<SubjectsStrip>` BELOW (preserved)                     |
| Photo filter                 | `--filter-photo-newsprint`                         | same                                    | same                                    | same                                       | same                                                    |
| Paper grain overlay          | 4% radial gradient @ multiply                      | same                                    | same                                    | same                                       | same                                                    |
| Hover model                  | n/a (hero is not interactive on detail)            | n/a                                     | n/a                                     | n/a                                        | n/a (cover artefact not interactive)                    |
| Container width              | `--container-page` (1120px)                        | `--container-page`                      | `--container-page`                      | `--container-page`                         | `--container-page`                                      |
| Mobile collapse              | 60/40 → 1col (Phase 3-b locked)                    | 200/1fr/200 → 1fr-1fr + below row       | 220-220 → 1fr-1fr, max 420px            | 200/1fr/200 → 1fr-1fr + below row          | 60/40 → 1col, cover stays at 21:9                       |

## Vocabulary deltas summary

| Option | Δ count | Severity    | Notes                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**  | 3       | Medium      | Drops `EditorialHeroShell`, drops `SubjectsStrip`, drops `coverImage` in hero. Re-purposes polaroids as the hero artefact. Master plan §5.2 says this was the original intent — but it directly overrides the Phase 3-b cover-image-in-right-column lock.                                                                                               |
| **B**  | 3       | Medium      | Same drops as A. Adds new "title-above-polaroids" composition; nothing analogous exists on the homepage or elsewhere.                                                                                                                                                                                                                                   |
| **C**  | 3       | Medium-high | Same drops as A + introduces a nested 3-column flank-row composition. Two stacked regions read as "decision lattice" — heaviest layout machinery of the four.                                                                                                                                                                                           |
| **D**  | 2       | Low-medium  | Keeps `<TapedCard>` + `<TapedFigure>` for the cover artefact; preserves `<SubjectsStrip>`. The deltas are structural (cover-then-text-below instead of side-by-side) and a new `landscape-21-9` aspect ratio on `<TapedFigure>` (which today supports 16-9, 3-2, square, portrait-3-4 — adding a wider variant is one prop value, not a new primitive). |
| **E0** | 0       | n/a         | Already locked. Listed as a reference for honest comparison. Picking E0 means closing this drill without changes.                                                                                                                                                                                                                                       |

## Things this drill does NOT decide

- **Per-variant overlays** — interview interviewee polaroids, transfer crests, event meta strip, match scoreline. Each routes to its own per-variant drill (5.d-int / 5.d-tra / 5.d-evt / 5.d-mat).
- **Cover-image-missing fallback** — handled in 5.A.1 implementation (#1792). Most likely: cream-on-cream tape-textured block with the same kicker / title / lead / byline composition.
- **Mobile breakpoint behavior** — handled in 5.A.1. The mock indicates collapse rules per option but final breakpoint values are implementation-time.
- **Hero hover model** — not interactive on detail. Homepage placement applies the press-up hover separately (Phase 4.5 R1).

## Net new primitives proposed by the new options

| Option    | Primitive                                                             | Status                                                                                          |
| --------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| A / B / C | None — all four reuse existing primitives. Compositional change only. | OK, but structural override of Phase 3-b shell.                                                 |
| D         | `<TapedFigure aspect="landscape-21-9">` — new prop value              | Trivially additive — one line in the `ASPECT_VALUE` map of `TapedFigure.tsx`. No new component. |

## Source locks consulted

- `docs/design/mockups/phase-3-b-editorial-hero/interview-locked.md` (P3-b interview shell, SubjectsStrip)
- `docs/design/mockups/phase-3-b-editorial-hero/announcement-locked.md` (P3-b non-interview shell)
- `docs/design/mockups/phase-4-homepage/hero-locked.md` (P4.5 R1 — homepage hero shape)
- `docs/design/mockups/phase-4-homepage/photo-treatment-system-locked.md` (P4.5 R9 — photo filter, tape, paper grain)
- `apps/web/src/components/design-system/TapedCard/TapedCard.tsx`
- `apps/web/src/components/design-system/TapedFigure/TapedFigure.tsx`
- `apps/web/src/components/design-system/EditorialHeroShell/EditorialHeroShell.tsx`
