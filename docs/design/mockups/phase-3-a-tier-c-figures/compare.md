# Phase 3 — Checkpoint A — Tier C Figures · Compare

**Surfaces:** `<PlayerFigure>`, `<JerseyShirt>`, `<EndMark>`, `<QASectionDivider>`
**Issue:** #1525 · master design `docs/plans/2026-04-27-redesign-master-design.md` §4.4 / §5.3
**Brief:** see `docs/plans/2026-05-03-redesign-phase-3-design.md` §2 — Checkpoint A.

## Options

| Option | File | Direction |
|---|---|---|
| A | `option-a-photobooth-strip.html` | Photobooth strip — vertical polaroid portrait, flat block-color silhouette behind, asterisk-cluster EndMark, taped-paper QA divider. |
| B | `option-b-stamped-block-print.html` | Stamped block-print — 2-tone overprint with deliberate misregistration; postmark JerseyShirt; rotated jersey-green ribbon QA divider. |
| C | `option-c-matchday-programme.html` | Matchday programme — rule-bordered photo + mono name plate; line-art (1px) illustration; graph-paper JerseyShirt thumbnails; thin double-rule QA divider. |

## Visual decision map

For each visual choice every option must trace back to an approved primitive (per `feedback_reuse_approved_primitives`). Source primitives: TapedCard, TapeStrip, TicketStub, MonoLabel, EditorialHeading, ClippedCard, StampBadge.

| Decision | Option A | Option B | Option C |
|---|---|---|---|
| `PlayerFigure` outer wrap | TapedCard (rotation A) + TapeStrip | TapedCard rotation B + TapeStrip | TapedCard (no rotation) + thin TapeStrip |
| `PlayerFigure` photo treatment | Polaroid-strip rectangular crop, flat silhouette behind | Photo desaturated + 2-3px misregistered ink outline overlay | Photo with 1px ink rule frame + line-art jersey overlay |
| `PlayerFigure` photo-missing fallback | Block silhouette + jersey number | Pure 2-tone block-print, no photo well | 1px line-art only, name plate becomes anchor |
| `PlayerFigure` metadata | TicketStub stamnr + MonoLabel team/role | TicketStub + StampBadge "NIEUW" rotation | TicketStub + mono name plate row |
| `JerseyShirt` frame | Cream paper card, ClippedCard corner | StampBadge-style postmark with serrated edge | Faint 8px graph-paper bg inside ClippedCard |
| `JerseyShirt` letter overlay | Freight Display 900 jersey-deep | Block-print 2-tone overprint | Mono caps centered |
| `EndMark` | `* * *` Freight Display 900 cluster | Jersey-deep ★ + em-dash + italic mono "EINDE" | Thin 1px rule passing through mono "EINDE GESPREK" tag |
| `QASectionDivider` flourish | Horizontal taped paper strip with pull-quote slot | Rotated jersey-green ribbon (MonoLabel-like band) with cream italic title | Thin double-rule (1px) framing italic Freight Display title + jersey-green stars |

## Trade-off summary

| Criterion | A — Photobooth | B — Block-Print | C — Programme |
|---|---|---|---|
| **Photo-first feel** | Strong — photo dominates | Moderate — photo competes with overprint | Strong — photo is the anchor with frame |
| **Distinctive vs current site** | Medium | High — most fanzine-leaning | Low — closest to editorial-classic |
| **Illustration weight when no photo** | Heavy (filled silhouette reads bold) | Heavy (block-print is the design) | Light (line-art can read thin) |
| **Tier-C cohesion across 4 figures** | High (asterisk + tape vocabulary repeats) | Highest (stamped vocabulary unifies all four) | Medium (rules + grid feel can read static) |
| **Scales to dense pages (interview, profile)** | OK — strip shape locks vertical rhythm | Good — print noise tolerates dense type | Best — programme grammar handles density |
| **Print-fanzine taste** | Medium-high | Highest | Medium |
| **Implementation complexity** | Medium (silhouette assets) | High (overprint / blend modes / misregistration) | Low (line-art SVG + rules) |
| **Risk if photo source quality is poor** | Low (silhouette compensates) | Low (overprint hides imperfection) | High (frame magnifies bad crops) |

## Owner choice

> _Pick one option below. The chosen option's `compose.md` follow-up is **not** required for Checkpoint A — that pass only applies to Checkpoint B (EditorialHero variants)._

- [ ] Option A — Photobooth Strip
- [ ] Option B — Stamped Block-Print
- [ ] Option C — Matchday Programme

**Rationale (after pick):** _to be filled in by owner._

## Next step

Once an option is chosen, the PRD `docs/prd/redesign-phase-3.md` §3 (Tier C figures) cites the chosen mockup file path and freezes the visual direction for sub-issues 3.A.1–3.A.4.
