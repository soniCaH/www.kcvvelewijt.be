# 5.d3 · Section-break flourish — primitive map

**Round 1.** Every visual choice in
`round-1-section-break-comparisons.html` maps back to a locked
primitive. Net-new vocabulary is called out as a delta (Δ). Per
`feedback_reuse_approved_primitives`.

Reference locks consumed:

- Phase 0 · `<StripedSeam>` — canonical full-bleed seam primitive
- Phase 3-b interview lock · `<QASectionDivider title>` italic centered + flanking thin rules
- `<QASectionDivider flourish="em-dash" | "star">` — existing flourish API
- `feedback_visual_preferences` — prefer typographic glyphs over Lucide equivalents
- `feedback_border_spec_triple` — every divider/seam line ships `{weight, color-token, opacity}`

## Baseline vs. alternatives

This drill compares four alternatives against an existing baseline:

- **E0 — Phase 3-b treatment** (the baseline): `<QASectionDivider title>` italic centered subtitle + flanking 1px ink rules at 0.55 opacity. Already locked in `interview-locked.md`; carried forward into the body section-break role. The final lock recorded in `section-break-locked.md` keeps E0 unchanged.
- **Alternatives A–D** (in `round-1-section-break-comparisons.html`): diamond glyph (A) / `<StripedSeam height="sm">` mid-article (B) / dotted divider alone (C) / no break (D). Each was evaluated against E0 to see whether it adds enough to justify net-new vocabulary or a register shift.

## Use sites consuming this vocabulary

- `<QASection>` interview body — major Q&A section break with a section subtitle.
- Future article body `<h2>` — any non-interview variant body that has explicit section breaks (column / event recap with multi-act structure, etc.) Inherits the same flourish.

## Option-by-option vocabulary map

| Element                       | A — diamond                                                | B — StripedSeam                                               | C — dotted                                           | D — none                                       |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| Visual                        | Single ◆ glyph (Unicode U+25C6) + thin-rule subtitle below | 12px-tall full-bleed seam, ink+cream diagonal stripes         | Single full-prose-width dotted line + subtitle below | Extra vertical breathing only; subtitle alone  |
| Width                         | Prose width (680px)                                        | **Full-bleed** (viewport width)                               | Prose width                                          | Prose width                                    |
| Vertical footprint            | ~50px (glyph + subtitle row)                               | ~58px (seam + subtitle row)                                   | ~40px (rule + subtitle row)                          | ~76px (48px gap + subtitle row)                |
| Source primitive              | n/a — typographic glyph                                    | `<StripedSeam height="sm" colorPair="ink-cream">`             | `<hr>` (1px dotted, ink-muted, opacity 0.7)          | n/a — spacing only                             |
| Subtitle treatment            | Existing flanking-thin-rules row                           | Subtitle below seam, no flanking rules                        | Subtitle below `<hr>`, no flanking rules             | Subtitle alone                                 |
| `QASectionDivider` API impact | Adds `flourish="diamond"` variant                          | Adds `flourish="seam"` (or render `<StripedSeam>` separately) | Adds `flourish="dotted"` OR removes flourish prop    | Removes flourish prop; subtitle stays          |
| Existing usage in system      | None mid-prose                                             | Section boundaries between page regions (homepage, etc.)      | Article body today (legacy)                          | Common pattern in long-reads / Q&A transcripts |

## Vocabulary deltas summary

| Option | Δ count | Severity | Cost                                                                                                   | Notes                                                                                                                                                                                                         |
| ------ | ------- | -------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**  | 1       | Low      | Add `flourish="diamond"` enum value to `<QASectionDivider>`.                                           | Glyph is Unicode (no SVG asset). Existing thin-rule subtitle row preserved. Minimal new chrome.                                                                                                               |
| **B**  | 1       | Medium   | First in-article use of `<StripedSeam>`.                                                               | Strongest visual punctuation of the four. Full-bleed in a prose context is a register shift — every prior `<StripedSeam>` separates page regions, not paragraphs. Reads "the page just turned" — high energy. |
| **C**  | 1       | Low      | Either remove the flanking-rules variant of `<QASectionDivider>` OR add a `flourish="dotted"` variant. | Quietest. Closest to legacy. Loses some of the Phase 3-b flanking-rules detail.                                                                                                                               |
| **D**  | 0       | Low      | Drop the flourish prop entirely (or default it to `"none"`).                                           | No new chrome at all. Subtitle alone carries the transition. Risk: reads as a normal paragraph spacing change, not a section boundary.                                                                        |

## Things this drill does NOT decide

- **Section-break markers in body PT** — whether the Sanity body has an explicit "section-break" block type or whether the renderer derives breaks from heading-boundary insertion. Decide at 5.A.1 (#1792) per PRD §5.
- **Body width** — locked elsewhere at `--container-prose: 680px`.
- **EndMark / article close mark** — separate from mid-article breaks. Continues to use `<EndMark flourish="star" | "em-dash">` at the article footer.
- **Whether non-interview variants use section breaks at all** — the column / event / transfer variants may not need them. The flourish vocabulary is available; individual variant drills (5.d-col / 5.d-evt / 5.d-tra) decide whether to use it.

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d3-section-break/round-1-section-break-comparisons.html`
- Component sources: `apps/web/src/components/design-system/StripedSeam/StripedSeam.tsx`
- Phase 3-b lock: `docs/design/mockups/phase-3-b-editorial-hero/interview-locked.md` (Q&A section structure)
- Memories consumed: `feedback_reuse_approved_primitives`, `feedback_visual_preferences`, `feedback_border_spec_triple`, `project_diagonal_to_stripedseam_migration`.
