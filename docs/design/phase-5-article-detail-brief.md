# Phase 5 — Article Detail · Consolidated Design Brief

**Status:** waiting. Consolidates the visual baseline + Phase 4.5 system inheritance + owner refinement prompts (2026-05-14) into a single input for the Phase 5 design drill. Not a locked decision — net-new vocabulary needs a drill round and owner sign-off per [[feedback_design_drill_pattern]] and [[feedback_guardrail_refinements_to_locked_primitives]].

**Owner:** @climacon.
**Predecessor:** Phase 4.5 homepage refinement (#1745, all R1–R10 locks).
**Master plan section:** `docs/plans/2026-04-27-redesign-master-design.md` §5.2 (duo interview), §6.2 (non-interview variants).
**Visual baseline:** `docs/design/mockups/retro-terrace-fanzine/duo-interview-desktop.png` + `duo-interview-mobile.png` + `homepage-interview.png`.

---

## 1. System inheritance (locked in earlier phases — non-negotiable)

These are non-decisions: Phase 5 must honor them. Listed so any future drill round inherits the system rather than re-deriving it.

### From Phase 4.5 R9 — Photo treatment system

- **Photo filter:** every `<TapedFigure>` image uses `--filter-photo-newsprint` (sepia 0.06, saturate 0.94, hue-rotate −4deg, contrast 1.02, brightness 1.01). Tunable per-instance via `data-tint="none"` for designed graphics.
- **Paper grain:** `::after` overlay with `--pattern-paper-grain` at `opacity: 0.04, mix-blend-mode: multiply`.
- **Asymmetric photo shadow:** `--shadow-photo-tape` = `2px 4px 0 0 ink`. Hover lift = `--shadow-photo-tape-lift` (4px 8px 0 0 ink).
- **Tape variety:** `<TapeStrip>` supports `edge="torn"` for any photo surface; `--color-tape-cream` joins `warm` + `jersey` for 3-colour rotation. Each `<TapedFigure>` gets 1–2 strips, independent colour + rotation per strip, slot-deterministic cycle.
- **Tape on card frame, not photo:** strips anchor to outer card (move with card hover), not to inner photo (which lifts independently).

### From Phase 4.5 R10 — Card structure

- **Flush-edge card structure** for any list/grid card consuming `<NewsCard>`: outer `<TapedCard>` is the only frame, image fills top region edge-to-edge, ink 1px rule divides image from meta panel. Applies to the "Verder lezen" related-articles row at article footer.
- **No nested `<TapedFigure>` inside `<NewsCard>`.**

### From Phase 4.5 R3 — Per-articleType card backgrounds

- "Verder lezen" related cards inherit the same per-articleType backgrounds as `<NewsGrid>`: `transfer` = jersey-deep / cream text, `interview` / `announcement` / `event` = cream / ink text. Default to cream for unknown types.

### From Phase 0–4 primitives (master plan §4)

- **Card vocabulary:** `<TapedCard>` (rotation a/b/c/d, taped, hard offset shadow), `<ClippedCard>` (archival, no rotation — out of scope here).
- **Image primitive:** `<TapedFigure>` (16:9 default, accepts square/portrait/auto). The article body's inline image primitive.
- **Heading vocabulary:** `<EditorialHeading size="display-xl|lg|md|sm">` with `accent` decorator for jersey-deep emphasis on substring. Italic Freight Display Pro.
- **Labels:** `<MonoLabel>` (ink + cream tones, never `text-cream/85` on jersey-deep — full opacity per [[feedback_monolabel_cream_full_opacity]]).
- **Inline emphasis in body copy:** Portable Text custom decorator only — never a flat string + separate accent-substring field (per [[feedback_inline_emphasis_via_portable_text]]).
- **Hover model:** canonical press-down everywhere (`hover:shadow-none hover:translate-x-1 hover:translate-y-1` + `transition-all duration-300`). No per-component soft-press variants.
- **Section seams:** `<StripedSeam>` is the canonical divider — legacy `<SectionTransition type="diagonal">` is retiring (#1701).
- **Body width:** `--container-prose: 680px` for any long-form article body.
- **Close mark:** `<EndMark flourish="star" | "em-dash">` at long-read footer.

### From the master plan's §5.2 stack (the existing duo interview spec)

The current canonical stack is `<InterviewHero>` (headline flanked by two `<TapedCard>` figures) → `<DropCapParagraph>` with `<MonoLabel>INTRO</MonoLabel>` → `<QASection>` (alternating `<QARow>` + `<QASectionDivider>` at `--container-prose` width) → `<PullQuote tone="jersey" | "ink">` interspersed → `<EndMark flourish="star">` → `<InterviewCredits>`. Q&A row: green Freight Display 900 number left, mono speaker tag, `text-display-sm` 600 question, `text-body-md` answer, dotted divider between rows.

---

## 2. Element-by-element primitive map (refinement prompt → source primitive)

For each element the owner specified in the refinement prompt, the source primitive it composes from. Where no existing primitive fits, **DELTA** is flagged.

### Article header (prompt §1 — "title is the centerpiece, not the photo")

| Refinement element                                                    | Source primitive                                                                                  | Notes / delta                                                                                                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tape-label breadcrumb top ("INTERVIEW · DUBBELGESPREK · 8 MIN")       | `<MonoLabelRow>` (already exists for §5.2 InterviewHero kicker)                                   | Reuse the InterviewHero kicker pattern.                                                                                                                                                                    |
| Green kicker line ("AFSCHEID DUBBEL")                                 | small star-kicker pattern from §5.2 (`* AFSCHEID DUBBEL *`)                                       | Direct reuse.                                                                                                                                                                                              |
| Centered headline in serif with italic accents on key words           | `<EditorialHeading size="display-xl" emphasis={{text:"...", highlight:true}}>` italic Freight Big | **DELTA — alignment.** Existing §5.2 InterviewHero left-aligns the headline. Centered layout is a net-new composition direction. Drill question 1.                                                         |
| Italic standfirst beneath title                                       | `<EditorialLead>` (Phase 3 lead component)                                                        | Reuse.                                                                                                                                                                                                     |
| Two side-by-side polaroids beneath title block, names handwritten     | `<TapedCard rotation>` × 2 with `<PlayerFigure imageSrc>` + caption row (italic, opacity 0.65)    | **DELTA — placement.** §5.2 places polaroids *flanking* the headline (left/right). Prompt places them *below*. Drill question 1 covers this.                                                               |
| "Handwritten" name beneath each polaroid                              | `<TapedFigure>` caption slot (existing — italic, opacity 0.65)                                    | Reuse. Note: no true handwritten-font in the design system; italic Freight Display is the closest. Hard "handwriting" is out of vocabulary unless we want to add it as a font (separate decision).         |
| Thin rule + metadata row "date · author · photographer · reading time" tracked uppercase | `<EditorialByline>` row + `<DashedDivider>` or 1px ink rule                            | Reuse. `<EditorialByline>` already metadata-row pattern in §5.2.                                                                                                                                           |

**Net composition decision (drill question 1):** does the article header read better with (a) the current §5.2 *flanked* layout (headline between two figures), or (b) the prompt's *stacked* layout (title-first, photos beneath)? Two distinct compositions of the same primitives — owner picks.

### Body copy (prompt §2 — "long-form editorial, not CMS dump")

| Refinement element                                                                                  | Source primitive                                                              | Notes / delta                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Serif body 18–19px / line-height 1.7–1.8 / max-width 680px                                          | `--container-prose: 680px` + existing body typography tokens                  | Existing tokens. Confirm body line-height token matches 1.7–1.8 at PR time.                                                                                                    |
| First paragraph with floating "INTRO" tape label in left margin + drop cap                          | `<DropCapParagraph>` + `<MonoLabel variant="pill-jersey">INTRO</MonoLabel>` overlay | Already in §5.2. "Floating in left margin" is a placement refinement of the existing component — Storybook test required to confirm gutter behaviour at narrow viewports.  |
| Section breaks: small green diamond ornament centered                                               | `<QASectionDivider flourish="em-dash" | "star">` — needs new `flourish="diamond"` variant | **DELTA — minor.** New flourish glyph. Add as a `flourish` variant; rounds with the same component, no new primitive.                                                          |
| Subheadings ("14 seizoenen Elewijt.") in italic serif, centered, thin rules left + right            | `<QASectionDivider>` already does exactly this for `title` prop               | Reuse. The mockup already implements this pattern — confirm Phase 5 PRD reuses this primitive verbatim, no rebuild.                                                            |
| Body images at "tape treatment, breaking the column slightly on both sides"                         | Inline `<TapedFigure aspect="landscape-16-9">` at >680px width                | Reuse. "Breaks column on both sides" = `<TapedFigure>` rendered at viewport-width or `--container-wide`, not constrained to `--container-prose`. Confirm via drill in PR.      |

### Q&A format (prompt §3 — "signature component")

The current §5.2 spec already matches the prompt almost line-for-line. Reuse `<QASection>` + `<QARow>` + `<QASectionDivider>` verbatim.

| Refinement element                                                                          | Source primitive                                       | Notes / delta                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Numbered marker "01, 02, 03..." in large green Freight Display 900 left of each row         | `<QARow number>` (existing)                            | Reuse.                                                                                                                                                                                                                                                                                                                                     |
| Small "JULIEN" / "NIELS" speaker label in mono beneath number                               | `<QARow speaker>` (existing)                           | Reuse.                                                                                                                                                                                                                                                                                                                                     |
| Question in bold serif, answer in regular serif                                             | `<QARow question>` + `<QARow answer>` (existing tokens) | Reuse.                                                                                                                                                                                                                                                                                                                                     |
| Small circular illustrated character avatar on right edge of each row, switches per speaker | New `<QARow avatar>` prop (currently optional)         | **DELTA — illustration vocabulary.** "Illustrated character avatar" implies a per-subject illustration. We don't have illustrated character avatars in the system — `<PlayerFigure>` is full-body or shoulders-up; no head-only or character-cartoon vocabulary. Drill question 2 covers what fills this slot: photo crop, initial monogram, or new illustration vocabulary. |
| Hairline divider between rows                                                               | `<DottedDivider>` (existing, used in §5.2 spec)        | Reuse.                                                                                                                                                                                                                                                                                                                                     |

**Drill question 2:** the per-speaker avatar — what fills it? Three options to mock: (a) circular photo crop from `player.psdImage` (cheap, photo-realistic, available for every subject); (b) initial-monogram in a jersey-deep disc (no portrait dependency); (c) new illustrated character avatar (would need 4–6 character variants drawn; expensive, but distinctive — would also feed the player profile's "vorm" indicator pattern).

### Pull quotes (prompt §4 — "dramatic, not decorative")

| Refinement element                                                                                  | Source primitive                                            | Notes / delta                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Full-width treatment (break body column entirely)                                                   | `<PullQuote>` rendered at `--container-wide`, not `--container-prose` | Reuse — confirm placement. §5.2 already places `<PullQuote>` between Q&A clusters at full width.                                                                                                                                                                          |
| Two variants: jersey green bg + cream type, OR ink bg + cream type with green tape strips top/bottom | `<PullQuote tone="jersey" | "ink">` (existing)              | Reuse — `tone` prop is exactly this distinction.                                                                                                                                                                                                                         |
| Small character avatar in right margin (jersey variant)                                             | Same as Q&A avatar — see drill question 2                   | **DELTA tied to drill Q2.** If Q2 lands on photo crops, the pull-quote avatar reuses that crop. If Q2 lands on illustration, same.                                                                                                                                       |
| Oversized green double-comma quote marks top-left                                                   | Existing pull-quote QuoteMark composition                   | Reuse.                                                                                                                                                                                                                                                                   |
| Attribution beneath in small tracked uppercase with green em-dash                                   | `<EditorialByline>` row + green em-dash glyph               | Reuse — the green em-dash is the canonical attribution separator (see retro-terrace-fanzine mockups).                                                                                                                                                                    |
| 1 pull quote per ~600 words                                                                         | Editorial guidance, not a component spec                    | Document in Sanity Studio description on the `pullQuote` block. Not a design decision.                                                                                                                                                                                   |

### "Verder lezen" + "Editie" footer (prompt §5 — "give long-reads memory")

| Refinement element                                                                          | Source primitive                                                                                | Notes / delta                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Verder lezen" component: 2–3 related articles from Sanity tags, taped polaroid cards in a row | `<NewsCard>` × 2–3 in a `<TapedCardGrid columns={3}>`                                            | **Reuse, but new placement.** Component already exists from Phase 4.5 R10 (flush-edge). The Sanity GROQ for "related by tags" is a small new BFF/repository function (not a design lock — implementation detail for PRD).                                                                                                                                                                                            |
| Thin "Editie" line: "Editie 47 · Lente 2026 · KCVV Elewijt Magazine" tracked uppercase      | `<MonoLabel tone="ink">` row, full-bleed centered                                               | **DELTA — minor.** New micro-component but composes from `<MonoLabel>`. Decision: is "Editie 47" auto-generated (publication-order count of all articles), seasonal (Lente/Zomer/Herfst/Winter from `publishedAt`), or editor-authored? Drill question 3.                                                                                                                                                                                                                                                                                              |

**Owner direction 2026-05-14:** schema-migration appetite deferred to implementation-time per-field decisions, not an upfront drill. The "Editie 47" line — if it ships at all — defaults to UI-only (auto-derived season + sequence from `publishedAt`). Promote to a schema field only if editorial demands it during build. Q3 closed at brief level.

---

## 3. Confirmed deltas vs. master plan §5.2 / §6.2 (needs owner sign-off before PRD)

1. **Article header layout — centered title-first vs flanked title.** Prompt §1 stacks title above two polaroids; current §5.2 spec flanks. Drill question 1.
2. **Q&A row avatar fill.** Drill question 2 — photo crop / monogram / new illustration vocabulary. Decision feeds back into pull-quote avatar treatment.
3. **Section-break diamond flourish.** Tiny — adds a `flourish="diamond"` variant to `<QASectionDivider>`. Owner sign-off needed but no design round needed.
4. **"Verder lezen" placement** — net-new at the article footer (not in §5.2 stack). Composes from existing primitives but inherits #1745's R3 per-articleType backgrounds for visual consistency.
5. **"Editie 47" line** — net-new editorial flourish. **Closed at brief level (2026-05-14):** UI-only auto-derived from `publishedAt` (season + sequence count). Schema field only if editorial demands during build.

---

## 4. Variant scope reminder (master plan §6.2)

§5.2 covers *duo interview*. Phase 5 also has to ship variants for: matchverslag, column, transfer, jeugd, evenement, generic. The refinement prompts target the *interview* variant only. Other variants inherit:

- All system locks from §1 above.
- The Q&A vocabulary is interview-specific. Other variants use the same body / pull-quote / EndMark / "Verder lezen" / Editie footer pattern but skip `<QASection>`.
- Each non-interview variant likely needs its own EditorialHero variant (already locked at the type level in #1638). The article body structure is the same across variants.

The Phase 5 design drill rounds should sequence: (i) interview consolidation drill (this brief), (ii) per-variant header drills (one per non-interview articleType), (iii) lock body structure once, ship.

---

## 5. Open drill questions (consolidated)

| #   | Question                              | What to mock                                                                                                                                                                                                                                                                                              | Resolves                                                  |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Article header — centered or flanked? | Two compositions of the same primitives: (A) §5.2 *flanked* layout (current spec) vs (B) prompt §1 *stacked* layout (title above two polaroids). **Owner direction 2026-05-14:** drill leans toward centered-first but visual confirmation needed — mock B with at least one short-headline + one long-headline edge case. | Article identity. Affects all article variants.           |
| 2   | Q&A + pull-quote avatar fill          | Three side-by-side variants: (a) circular photo crop from `player.psdImage`; (b) initial monogram in jersey-deep disc; (c) new illustrated character avatar (4–6 character vocabulary). Show all three at Q&A row scale + pull-quote scale.                                                              | Subject-presence vocabulary across Q&A + pull-quotes.     |

Drill them in order — Q1 first (defines hero identity), Q2 second (composes through pull-quotes too).

~~Q3 "Editie 47" line — UI or schema?~~ — **Closed at brief level (2026-05-14):** UI-only, auto-derived from `publishedAt`. No drill round.

---

## 6. Hand-off note

When the next design drill round opens (`/design-an-interface` per [[feedback_design_drill_pattern]]), this brief is the input. Don't re-derive the system locks in §1 — quote them. The drill rounds in `docs/design/mockups/phase-5-article-detail/` are where the variants live; this doc stays the synthesised brief for kickoff.
