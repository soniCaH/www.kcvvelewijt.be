# Phase 3 — Checkpoint C — SiteHeader + MatchStrip · Compare

**Surfaces:** `<SiteHeader>` (sticky top) + `<MatchStrip>` (renders only when an upcoming match exists; live and concluded states are out of scope — see "MatchStrip state matrix coverage" below).
**Issue:** #1525 · master design `docs/plans/2026-04-27-redesign-master-design.md` §5.1
**Brief:** see `docs/plans/2026-05-03-redesign-phase-3-design.md` §2 — Checkpoint C.

## Options

| Option | File                              | Direction                                                                                                     |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A      | `option-a-classic-newsstand.html` | Cream paper masthead with hairline rules. Reads like a daily newspaper masthead.                              |
| B      | `option-b-ink-band.html`          | Ink top band with cream wordmark + cream mono nav. Stadium-concourse contrast.                                |
| C      | `option-c-taped-flyer.html`       | TapedCard-wrapped header with TapeStrip flourish; MatchStrip uses TicketStub aesthetic. Most fanzine-leaning. |

## MatchStrip state matrix coverage

> **Scope correction 2026-05-05:** Owner clarified that KCVV has no live
> data feed (and no plans for one) and does not sell tickets. The
> matchstrip surfaces **upcoming matches only**. Live and concluded
> states are out of scope. State matrix simplifies from 4 → 2.

| State                          | A                                                                 | B                                                              | C                                                                           |
| ------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **No upcoming** (strip hidden) | component returns `null` (placeholder is doc-only)                | component returns `null`                                       | component returns `null`                                                    |
| **Upcoming**                   | shield + competition + date/time + venue + `Wedstrijddetails` CTA | cream bg + 2px jersey-green left rail + `Wedstrijddetails` CTA | TicketStub: shield + dashed rule between segments + `Wedstrijddetails` stub |
| ~~**Live / in-progress**~~     | _out of scope (no live feed)_                                     | _out of scope_                                                 | _out of scope_                                                              |
| ~~**Concluded with result**~~  | _out of scope (matchstrip is forward-looking only)_               | _out of scope_                                                 | _out of scope_                                                              |

## Trade-off summary

| Criterion                             | A — Newsstand                                               | B — Ink Band                                      | C — Taped Flyer                                                        |
| ------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| **Brand recognition vs current site** | Medium (familiar paper feel)                                | High (sharp departure)                            | Highest (most distinctive)                                             |
| **Nav legibility**                    | Highest (cream bg + ink type, IBM Plex caps)                | High (cream-on-ink reverses; relies on weight)    | Medium (paper card competes with content rhythm)                       |
| **WORD LID button prominence**        | Medium (ink-on-cream button on cream bg)                    | Highest (jersey-green button against ink)         | Medium (ink button on tape-flecked card)                               |
| **MatchStrip readability**            | Highest (hairline rules pure tabular)                       | High (jersey rail anchors eye)                    | Medium (perforations + dashes can compete with content)                |
| **Sticky behaviour at scroll**        | Strongest (paper sits flat against content)                 | Strong (ink band lifts off cream content cleanly) | Risk — tape strips' rotation can feel busy when sticky                 |
| **Mobile collapse simplicity**        | Highest (already a single-row strip)                        | High (band collapses cleanly)                     | Medium (TapedCard wrap needs careful corner handling at narrow widths) |
| **Implementation complexity**         | Lowest (rules + flexbox)                                    | Low (background swap + jersey rail)               | Highest (rotated tape, perforation borders, dashed rules)              |
| **Primitive reuse density**           | Low — header is mostly chrome, MatchStrip cells are bespoke | Medium — borrows MonoLabel + StampBadge patterns  | Highest — TapedCard + TapeStrip + TicketStub all in chrome             |
| **Risk if MatchStrip is not present** | Low (header reads complete alone)                           | Low (header still anchors)                        | Low (header reads as a complete card on its own)                       |

## Visual decision map (selected)

| Decision              | A                         | B                           | C                                                  |
| --------------------- | ------------------------- | --------------------------- | -------------------------------------------------- |
| Background top band   | cream                     | ink                         | cream paper TapedCard                              |
| Wordmark colour       | ink Freight Display       | cream Freight Display       | ink Freight Display                                |
| Nav typography        | IBM Plex Mono caps        | IBM Plex Mono caps, cream   | IBM Plex Mono inline contents-list (`§ X · Y · Z`) |
| Search affordance     | `⌕` glyph                 | `⌕` glyph cream             | `⌕` glyph + tape corner                            |
| WORD LID button       | ink fill, cream text      | jersey-green fill, ink text | ink fill, cream text, on TapedCard                 |
| MatchStrip border     | hairline ink top + bottom | 2px jersey-green left rail  | TicketStub perforated edge + dashed dividers       |
| MatchStrip background | cream                     | cream                       | cream with subtle paper-edge gradient              |

## Decision recorded

> **Option A — Classic Newsstand** locked 2026-05-05. Options B and C are kept as historical record only.

- [x] **Option A — Classic Newsstand** (locked 2026-05-05)
- [ ] ~~Option B — Ink Band~~ _(historical record only)_
- [ ] ~~Option C — Taped Flyer~~ _(historical record only)_

**Rationale:** Option A's cream-paper masthead with hairline ink rules composes naturally with the locked Phase 3 B EditorialHero shell (Asymmetric Broadsheet — same cream/ink vocabulary), reads instantly as a club masthead, has the lowest implementation cost (rules + flexbox), and gives the cleanest sticky-scroll seam between header and content. The full per-question lock specs live in `header-locked.md` and `matchstrip-locked.md` — those files are the canonical sources of truth for the implementation contract; this `compare.md` is the historical drill-down record.

## Next step

Once an option is chosen:

1. PRD `docs/prd/redesign-phase-3.md` §5 (Layout chrome) cites the chosen mockup file.
2. Sub-issues 3.C.1 (`SiteHeader`) and 3.C.2 (`MatchStrip` — both locked states: hidden / upcoming) reference it.
3. PageHeader legacy retirement is in 3.B.3 / 3.C.1's call-site migration.
