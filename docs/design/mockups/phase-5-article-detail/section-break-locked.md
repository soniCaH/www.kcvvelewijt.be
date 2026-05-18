# Section-break flourish — locked

**Drill:** 5.d3 · Round 1 · #1785
**Locked:** 2026-05-18 by @climacon
**Mockups:** `5d3-section-break/round-1-section-break-comparisons.html`
**Primitive map:** `5d3-section-break/compare.md`

---

## Decision

**E0 — Phase 3-b `<QASectionDivider title>` thin-rule subtitle
stands. No flourish glyph above the subtitle.**

Mid-article section breaks render as a single row:

```text
──────── Het seizoen. ────────
```

- Italic Freight Display 900, centered, prose-width.
- Two flanking 1px ink rules at 0.55 opacity (matches Phase 3-b lock).
- No glyph above. No `<StripedSeam>`. No standalone dotted line.

## Rationale

- Owner observation 2026-05-18: a diamond (or any glyph) stacked
  **above** the existing thin-rule subtitle row was redundant — the
  flanking rules are already the punctuation. Adding a glyph on top
  just shouts.
- Option A (diamond + rules) was rejected as redundant.
- Option B (`<StripedSeam height="sm">`) was rejected as too loud
  for mid-prose — every prior `<StripedSeam>` usage separates page
  regions, not paragraphs. A full-bleed band inside an article body
  reads as "the page just turned", which is more energy than a
  Q&A section break needs.
- Option C (dotted divider alone) lost the Phase 3-b flanking-rules
  detail with no compensating benefit.
- Option D (subtitle alone, no rules) lost the section-break
  affordance — the subtitle alone reads as a normal heading change,
  not a structural break.
- E0 (the existing Phase 3-b treatment) carries the right amount of
  punctuation: enough to read as a break, not enough to compete with
  the body. Same shape as the 5.d1 + 5.d4 outcomes.

## API impact

- `<QASectionDivider>` **does NOT gain a `flourish="diamond"` variant.**
  The existing API (`flourish="em-dash" | "star"`) stays as is for
  end-of-section markers; mid-article section breaks render the title
  variant only (no flourish prop on those rows).
- No new component. No new SVG asset. No schema migration.

## What this drill resolves

- ✅ "What's the mid-article section-break treatment?" — Phase 3-b
  thin-rule subtitle, unchanged.
- ✅ "Does `flourish="diamond"` join the `<QASectionDivider>` API?"
  No.
- ✅ "Does `<StripedSeam>` render mid-prose?" No — stays at page-region
  boundaries.

## What this drill does NOT decide

- **Section-break markers in body PT** — whether Sanity's body PT
  carries an explicit "section-break" block type or whether the
  renderer derives breaks from heading-boundary insertion. Decide at
  5.A.1 (#1792) per PRD §5.
- **EndMark / article close** — separate primitive
  (`<EndMark flourish="star" | "em-dash">`) at the article footer.
  Unrelated to this drill.
- **Whether non-interview variants need section breaks at all** —
  drilled per variant (5.d-col / 5.d-evt / 5.d-tra). The Phase 3-b
  treatment is available; individual variants opt in or out.

## Net new primitives

None. `<QASectionDivider title>` is the Phase 3-b lock and ships
verbatim.

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d3-section-break/round-1-section-break-comparisons.html`
- Primitive map: `docs/design/mockups/phase-5-article-detail/5d3-section-break/compare.md`
- Phase 3-b lock: `docs/design/mockups/phase-3-b-editorial-hero/interview-locked.md` (`<QASectionDivider>` section structure)
- Memories consumed: `feedback_reuse_approved_primitives`, `feedback_visual_preferences`.
