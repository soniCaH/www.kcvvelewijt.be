# 5.d-tail-qa-header · Tail Q&A section header — primitive map

**Round 1.** Every visual choice in `round-1-tail-qa-header-comparisons.html`
maps back to a locked primitive. Net-new vocabulary is called out as a delta
(Δ). Per [[feedback_reuse_approved_primitives]].

Reference locks consumed:

- Phase 0 · `<StripedSeam>` — canonical full-bleed seam primitive
- Phase 1 · `<EditorialHeading size="display-md|lg|xl">` — italic Freight Display headings
- Phase 1 · `<MonoLabelRow>` — kicker rows ("_ X _")
- Phase 1 · `<HighlighterStroke color="jersey">` — hand-drawn marker underline
- Phase 3-b interview lock · `<QASectionDivider title>` flanking thin rules (italic centered subtitle)
- 5.d3 lock · `section-break-locked.md` — kept E0 (Phase 3-b treatment) unchanged
- `feedback_visual_preferences` — prefer typographic glyphs over Lucide equivalents
- `feedback_border_spec_triple` — every divider/seam line ships `{weight, color-token, opacity}`
- `feedback_monolabel_cream_full_opacity` — MonoLabel cream tone ships at full opacity (not used here; tail surface stays on cream)

## Baseline vs. alternatives

The baseline today is `<header class="mb-8 flex justify-center"><MonoLabel tone="ink">Q&A</MonoLabel></header>` at `apps/web/src/app/(main)/nieuws/[slug]/page.tsx:449-451`. Owner feedback: too quiet, "should be other typography, bigger". This drill replaces the baseline; no E0 carry-forward.

## Use sites consuming this vocabulary

- **Tail Q&A section** on `/nieuws/[slug]` for interview articles (and any future article variant where `groupAtTail` qaBlocks are hoisted out of the in-flow body). Single header per page when `tailBlocks.length > 0`.
- Header sits AFTER `<ArticleBody>` (whose final element is `<EndMark>`) and BEFORE the first tail `<QaBlock>`. May be followed downstream by `<EventDetailBlock>` (event variant), `<ArticleCredits>`, `<VerderLezenRow>`.

## Option-by-option vocabulary map

| Element            | A — kicker + heading                                                                 | B — heading + rules                                                                                  | C — seam + heading                                                                                         | D — marker heading                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Header role        | New editorial section after EndMark                                                  | New editorial section after EndMark                                                                  | New page region after EndMark                                                                              | New editorial section after EndMark                                                                                            |
| Visual             | Mono "_ Q&A _" kicker + italic display-md heading "Nog kort nagezweefd." centered    | Italic display-lg "Q&A." centered, flanked by 1px ink rules @ 0.55 opacity                           | Full-bleed striped seam (-45deg, ink/cream, 14px) → mono "Bonus · Q&A" kicker → italic display-lg heading  | Italic display-xl heading with `<HighlighterStroke color="jersey">` through "Q&A"                                              |
| Width              | Prose width (680px)                                                                  | Prose width (680px)                                                                                  | **Full-bleed** seam (viewport) + prose-width heading                                                       | Prose width (680px)                                                                                                            |
| Vertical footprint | ~96px (kicker + heading + spacing)                                                   | ~92px (heading + rules + spacing)                                                                    | ~140px (seam + kicker + heading + spacing)                                                                 | ~104px (heading + spacing)                                                                                                     |
| Source primitives  | `<MonoLabelRow>` + `<EditorialHeading size="display-md">`                            | `<EditorialHeading size="display-lg">` + flanking thin rules (E0 vocabulary at larger heading scale) | `<StripedSeam height="sm" colorPair="ink-cream">` + `<MonoLabel>` + `<EditorialHeading size="display-lg">` | `<EditorialHeading size="display-xl" emphasis={{text:"Q&A", highlight:true}}>` (composes `<HighlighterStroke color="jersey">`) |
| Period color       | Jersey-deep (existing convention)                                                    | Jersey-deep                                                                                          | Jersey-deep                                                                                                | Jersey-deep                                                                                                                    |
| Echoes             | InterviewHero "_ AFSCHEID DUBBEL _" kicker; EndMark "_ Einde gesprek _" rhythm above | 5.d3 baseline E0 / Phase 3-b QASectionDivider — but scaled up so it reads as section, not subsection | Homepage region boundaries (StripedSeam)                                                                   | InterviewHero headline scale                                                                                                   |

## Vocabulary deltas summary

| Option | Δ count | Severity | Cost                                                                                        | Notes                                                                                                                                                                                                               |
| ------ | ------- | -------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A**  | 0       | None     | Direct reuse of `<MonoLabelRow>` + `<EditorialHeading>`.                                    | Quietest. Voice-led. Rhymes with InterviewHero and EndMark patterns above. Risk: still quiet if the "_ Q&A _" kicker disappears against the cream like the current MonoLabel does.                                  |
| **B**  | 0       | None     | Direct reuse of E0 5.d3 vocabulary at display-lg instead of display-sm.                     | Most internally consistent with body section breaks. Risk: at display-lg the heading + thin rules combo can read as a continuation of body section breaks rather than a new section.                                |
| **C**  | 1       | Medium   | First in-article use of `<StripedSeam>`. Same register-shift cost flagged in 5.d3 option B. | Loudest separator. Reads as a page-region change. Risk: precedent — if accepted, future "tail sections" elsewhere may want it too, expanding StripedSeam's role from "page region" to "any major in-page boundary". |
| **D**  | 0       | None     | Direct reuse of `<EditorialHeading emphasis.highlight>`.                                    | Voice-led, largest typography. HighlighterStroke marker calls out the section. Risk: display-xl is the InterviewHero scale; using it for the tail header may compete with the page's lede headline.                 |

## Things this drill does NOT decide

- **Copy of the heading.** "Q&A." vs. "Nog kort nagezweefd." vs. "Tot besluit." — copy is variable across articles and editor-controlled. Drill question: typography/chrome only. If the lock requires a freeform heading slot (option A/C), the implementation may either default to "Q&A" or accept a Sanity field — decide in the implementation spinout.
- **Whether the tail section is visually distinguished from the article body** (different background, framed surface, etc.). All four options keep the tail on cream like the rest of the body. Background-shift is a separate question that could be revisited in a future round if option C feels insufficient.
- **Mobile typography scale.** All variants assume the desktop scale shown in the mockup. Mobile rules + sizes follow the canonical EditorialHeading responsive token cascade — confirm at implementation time.
- **What happens when `hasTail` is true but `tailBlocks.length === 0`.** Already handled in the existing `qaBlocksToTailSection` filter — out of scope.

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d-tail-qa-header/round-1-tail-qa-header-comparisons.html`
- Component sources: `apps/web/src/components/design-system/{EditorialHeading,MonoLabel,MonoLabelRow,StripedSeam,HighlighterStroke}/`
- Current implementation: `apps/web/src/app/(main)/nieuws/[slug]/page.tsx:449-451`
- Phase 3-b interview lock: `docs/design/mockups/phase-5-article-detail/interview-locked.md` (Q&A section structure)
- 5.d3 lock: `docs/design/mockups/phase-5-article-detail/section-break-locked.md` (kept Phase 3-b treatment for mid-body breaks)
- Tracker: #1860 · Spinout source: #1867
- Memories consumed: [[feedback_reuse_approved_primitives]], [[feedback_visual_preferences]], [[feedback_border_spec_triple]], [[feedback_design_drill_pattern]], [[feedback_drill_visual_then_ia]], [[feedback_monolabel_cream_full_opacity]]
