# Phase 3 — Checkpoint D — SiteFooter · Compare

**Surface:** `<SiteFooter>` only. Per owner flag (2026-04-29) this is **fresh divergent territory** — the footer must NOT be a refinement of the retro-terrace-fanzine screenshot footer.
**Issue:** #1525 · master design `docs/plans/2026-04-27-redesign-master-design.md` §5.1
**Brief:** see `docs/plans/2026-05-03-redesign-phase-3-design.md` §2 — Checkpoint D.

## Options

| Option | File | Direction |
|---|---|---|
| A | `option-a-poster-wordmark-block.html` | Poster wordmark block — full-bleed jersey band with massive "KCVV ELEWIJT" wordmark + 3-column directory below + ink bottom strip. |
| B | `option-b-stadium-board.html` | Stadium board — ink slab with mono board grid; 4 columns + fixtures ticker. Austere, technical. |
| C | `option-c-paper-fold-letterhead.html` | Paper-fold letterhead — single-column letter-style; crest left + address block right; centred motto; mono colofon. |
| D | `option-d-terrace-mural.html` | Terrace mural — layered collage of TapedCard panels with torn-paper edges, 1932 stamp, distributed information. Highest risk + highest distinctiveness. |

## Trade-off summary

| Criterion | A — Poster Block | B — Stadium Board | C — Letterhead | D — Terrace Mural |
|---|---|---|---|---|
| **Distinctiveness vs current site** | High | High (austere shift) | Medium | Highest |
| **Brand recall (wordmark prominence)** | Highest | Medium | Low (crest does the work) | Medium |
| **Information density** | Medium | Highest (4 cols + fixtures ticker) | Medium | Medium-high (distributed) |
| **Reads as "fresh ground"** (owner ask) | Yes — different vocabulary from screenshot | Yes — strongest departure | Yes — different paper register | Yes — most experimental |
| **Print-fanzine fit** | High | Low (technical, scoreboard) | Medium-high | Highest |
| **Mobile collapse simplicity** | Highest (3 cols → stack) | High (4 cols → 2 → 1) | Highest (already linear) | Medium — collage flattens; some distinctiveness lost on mobile (acknowledged in mockup) |
| **Implementation complexity** | Low | Medium (board grid, ticker animation if any) | Lowest | Highest (clip-path, rotations, layered panels) |
| **Primitive reuse density** | Medium (EditorialHeading, MonoLabel, BrandedTabs) | Medium-high (cards, mono caps) | Medium (DottedDivider, mono atoms) | Highest (TapedCard ×3, TapeStrip, TicketStub, StampBadge) |
| **Risk if footer is the only redesigned surface on a page** | Low (anchors visually) | Low (clear functional band) | Low (quiet, doesn't fight content) | Medium-high (mural can over-dominate above-fold context if content is sparse) |
| **Sponsor logo strip integration** | Sits naturally above the poster band | Could fit as a fixtures-like board row | Reads as a "stamps" row above letterhead | Awkward — collage doesn't host an aligned sponsor row |

## Visual decision map

| Decision | A | B | C | D |
|---|---|---|---|---|
| Background register | jersey-deep band + cream block + ink strip | full ink slab | full cream paper | cream + partial jersey wash + collage |
| Hero element | massive wordmark | mono fixtures + 4-col board | centred typographic motto | 1932 stamp + collage panels |
| Column count | 3 | 4 | implicit (3 in directory) | distributed (no formal columns) |
| Motto placement | mono row above wordmark | looped ticker band at top | centred, hand-set inside fold | torn-edge banner, jersey-bright ÉÉN |
| Social affordance | typographic glyph row in ink strip | inverted mini-cards with press-down | mono caps inline links | TicketStub social card |
| Bottom strip | ink with copyright + jersey separators | mono fixtures + legal | mono colofon | flat ink legal/colophon |
| Mobile distinctiveness retained | Mostly | Mostly | Yes | Reduced (acknowledged) |

## Owner choice

> _Pick one. Footer is a single sub-issue (3.C.3) so the choice locks the implementation directly._

- [ ] Option A — Poster Wordmark Block
- [ ] Option B — Stadium Board
- [ ] Option C — Paper-Fold Letterhead
- [ ] Option D — Terrace Mural

**Rationale (after pick):** _to be filled in by owner._

## Compatibility notes

- **Sponsor strip:** the existing sponsors block is the section *above* the footer (master design §5.1 step 10). Options A, B, C cleanly host or sit beneath it. Option D's collage requires an explicit visual seam (StripedSeam or PosterWordmark band) between sponsors and footer — note this in the PRD if D is chosen.
- **PosterWordmark band:** Options B, C, D do not include the existing `<PosterWordmark>` band (master design §5.1 step 11). If the chosen footer option doesn't already replace its function, `<PosterWordmark>` stays as a separate band before the footer.
- **Nav redundancy:** `<SiteHeader>` carries primary nav; the footer directory is secondary access. Options A, B, C handle this by keeping directory short. Option D distributes nav into a single TapedCard panel — same behaviour, different shape.

## Next step

Once an option is chosen:
1. PRD `docs/prd/redesign-phase-3.md` §5.3 (`SiteFooter`) cites the chosen mockup file.
2. Sub-issue 3.C.3 (`SiteFooter` rework) references it.
3. If Option D is chosen, the PRD adds an explicit "sponsor strip seam" requirement and an "above-mobile-only distinctiveness" caveat.
