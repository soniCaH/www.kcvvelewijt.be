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

## Owner choice

> _Pick one option below. After picking, run a follow-up "compose pass" — `compose.md` in this directory — that pins down each variant's artefact column composition (which TapedCard rotation, which approved primitives, what slots, photo treatment, kicker label set). The compose pass is checkpoint-internal; no new `/design-an-interface` run required._

- [ ] Option A — Asymmetric Broadsheet
- [ ] Option B — Stacked Poster
- [ ] Option C — Cover Frame

**Rationale (after pick):** _to be filled in by owner._

## Next step

Once an option is chosen and `compose.md` is written:

1. PRD `docs/prd/redesign-phase-3.md` §4 (EditorialHero) cites the chosen mockup file path and the compose.md.
2. Sub-issues 3.B.1 (shell + types) and 3.B.2 (variants) reference both artefacts.
3. 3.B.3 (PageHero retirement + call-site migration) follows once 3.B.2 is shipped.
