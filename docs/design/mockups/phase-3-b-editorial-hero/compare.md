# Phase 3 — Checkpoint B — EditorialHero · Compare

> **Direction locked 2026-05-05:** Option A — Asymmetric Broadsheet. Options B and C remain on disk as historical record only. Per-variant drill-down is in progress against the locked A shell.
>
> **Variant scope correction 2026-05-05** (see `feedback_editorial_hero_scope` memory + `docs/plans/2026-05-03-redesign-phase-3-design.md` §1):
> EditorialHero variants are 1:1 with Sanity `articleType`. **In Phase 3:** `interview | announcement | transfer | event` (4). **Deferred to #1470:** `matchPreview | matchRecap`. **Removed entirely:** `player` (Phase 6 — its own `<PlayerHero>`) and `generic` (redundant — every article has an articleType).

**Surface:** `<EditorialHero>` — single component scoped to article-type variants. Variant changes only the right-column artefact + kicker labels; headline + intro + CTA structure is shared.
**Issue:** #1525 · master design `docs/plans/2026-04-27-redesign-master-design.md` §4.4 / §5 (master design overruled on EditorialHero=player conflation per scope correction above)
**Brief:** see `docs/plans/2026-05-03-redesign-phase-3-design.md` §2 — Checkpoint B.

## Options (historical)

| Option         | File                                  | Direction                                                                                        |
| -------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **A** ★ locked | `option-a-asymmetric-broadsheet.html` | Asymmetric broadsheet — 60/40 left/right grid; vertical rule between text and artefact column.   |
| B              | `option-b-stacked-poster.html`        | Stacked poster — single-column poster; artefact band sits below the headline rather than beside. |
| C              | `option-c-cover-frame.html`           | Cover frame — ink-bordered outer frame; artefact overlaps the frame edge. Most contained.        |

## Variant artefact map (article-type variants only)

| Variant                             | A — Broadsheet (locked)                                              | B — Poster (historical)                                  | C — Cover frame (historical)                                 |
| ----------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| `transfer`                          | TapedCard rotation B with before/after shields beside text           | Wide horizontal band with shields + arrow below headline | TapedCard breaks frame edge with before/after shields        |
| `interview`                         | TapedCard with PlayerFigure thumbnails (N=1/2/3/4 from `subjects[]`) | 2-up band of PlayerFigure thumbnails                     | TapedCard PlayerFigure thumbnails breaking frame at angles   |
| `event`                             | TapedCard event-poster crop (16:9, same source as NewsCard)          | Full-width poster crop band + ticket-stub date marker    | Event poster TapedCard with TicketStub punched through frame |
| `announcement`                      | TapedCard centred StampBadge                                         | Large centred StampBadge in band                         | Large rotated StampBadge breaking top-right frame corner     |
| `matchPreview` _(deferred — #1470)_ | Opponent shield TapedCard + match info column                        | Wide band: shield + flat list + tickets CTA              | TapedCard breaks frame; date/venue strip outside frame       |
| `matchRecap` _(deferred — #1470)_   | Opponent shield TapedCard + final score column                       | Wide band: shield + score + competition meta             | TapedCard breaks frame; score strip outside frame            |

## Trade-off summary

| Criterion                                                   | A — Broadsheet                                                        | B — Poster                                           | C — Cover frame                                                |
| ----------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| **Headline weight**                                         | Medium (constrained to 60% column)                                    | Highest (full-width display-2xl)                     | Medium (constrained inside frame)                              |
| **Artefact prominence**                                     | Balanced co-equal column                                              | Subordinate band below                               | Object-like; breaks frame for emphasis                         |
| **Variant differentiation**                                 | High (artefact column changes shape per variant)                      | Medium (band shape constant; contents change)        | Highest (frame-break direction signals variant identity)       |
| **Mobile collapse simplicity**                              | Medium (column reorder)                                               | Highest (already single-column)                      | Medium (frame stays, artefact slides under)                    |
| **Implementation complexity**                               | Low (CSS grid 60/40 + responsive flip)                                | Lowest (single-column flow)                          | Medium (frame + overlapping absolute artefact = layering work) |
| **Distinctiveness vs current site**                         | Medium                                                                | Medium-high                                          | Highest                                                        |
| **Rhythm with other phase-3 figures**                       | High (artefact column is natural home for `PlayerFigure` and friends) | Medium (band can over-emphasise artefact thumbnails) | High (frame-break = playful, scrapbook-feel)                   |
| **Risk for content-light variants (announcement, generic)** | Low (column gracefully hosts a single stamp/glyph)                    | Medium (band feels empty if artefact thin)           | Low (frame contains the weight regardless)                     |

## Photo-first compatibility

All three options work with rectangular `psdImage` portraits in `interview` and `player` variants. Option C's frame-break is the most photo-flattering (object-like presentation), but also the strictest about photo crop quality. Option B's wide band is the most forgiving for low-quality crops because the band can absorb mismatched aspect ratios.

## Decision recorded

> **Option A — Asymmetric Broadsheet** locked 2026-05-05. Options B and C are kept as historical record only. Any reopen of this decision requires a fresh `/design-an-interface` round.

The drill produced canonical detail mockups and per-variant locked specs directly — there is no consolidated `compose.md` (it was originally proposed as a checkpoint-internal follow-up, but the four per-variant `*-locked.md` files cover the same ground at higher fidelity). A `compose.md` is only required if the variant set itself changes (e.g. when issue #1470 lands `matchPreview` / `matchRecap` and they need a unified composition pass alongside the existing four).

## Post-decision references

The lock cascades through these existing artefacts:

1. **Per-variant locked specs** in this directory — `announcement-locked.md`, `transfer-locked.md`, `event-locked.md`, `interview-locked.md`. Each pins shell composition, slots, field-source map, schema dependencies, mobile collapse, reuse mandate, and approval checklist for its variant. These are the canonical implementation contracts.
2. **PRD `docs/prd/redesign-phase-3.md` §4** — synthesises the EditorialHero spec across all four variants (discriminated union prop shape, shared sub-components, schema-migration list, exit criteria).
3. **Sub-issues 3.B.1, 3.B.2, 3.B.3** — Ralph-eligible work items (created post-PRD-merge via `/prd-to-issues`); 3.B.1 = shell + types, 3.B.2 = variants + 5 blocking schema migrations (depends on 3.A.1 + 3.A.2 + 3.B.1), 3.B.3 = `<PageHero>` retirement + call-site migration (depends on 3.B.2).
