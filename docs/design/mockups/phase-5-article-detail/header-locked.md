# Article header layout — locked

**Drill:** 5.d1 · Round 1 · #1783
**Locked:** 2026-05-18 by @climacon
**Mockups:** `5d1-header/round-1-header-layout-comparisons.html`
**Primitive map:** `5d1-header/compare.md`

---

## Decision

**E0 — the existing Phase 3-b `<EditorialHero>` shell stands.** The
"centered or flanked?" framing in the brief §5 Q1 / issue #1783 was a
re-open of an already-locked decision. After visually comparing the four
proposed alternatives (A flanked / B stacked-centered / C hybrid /
D full-width spotlight) against E0 — each rebuilt with strictly
vocabulary-faithful primitives — the locked shell holds.

## What that means concretely

Every article-detail variant continues to use the Phase 3-b lock:

1. **Shell:** `<EditorialHeroShell>` 60/40 grid — editorial column on
   the left, cover artefact column on the right, single 1px ink rule
   separating hero from body. Collapses to one column below the `lg`
   breakpoint.
2. **Editorial column (left, 60%):** `<MonoLabel tone="ink">` kicker
   row, `<EditorialHeading size="display-xl"` italic Freight Display
   with `accent` decorator, `<EditorialLead>` italic display (max
   ~60ch), `<EditorialByline>` mono caps line.
3. **Cover artefact column (right, 40%):** `<TapedCard rotation="a">` wrapping `<TapedFigure aspect="landscape-16-9">` of `article.coverImage`, with a single `<TapeStrip color="jersey">` on top.
4. **Subjects (below hero):** `<SubjectsStrip>` per
   `interview-locked.md` state matrix — polaroid pair for N=2 with
   italic display "&", N=1 with inline pull-quote, etc.
5. **Photo treatment:** Phase 4.5 R9 — `--filter-photo-newsprint`
   sepia/saturate/hue-rotate, paper-grain `::after` at 4% multiply,
   tape anchored to outer card frame.

## Rationale

- **The brief §5 Q1 framing was generated from the master plan §5.2
  visual baseline**, which predates the Phase 3-b lock. Reading both
  documents in order: §5.2 sketched a flanked composition; Phase 3-b
  drilled it into the Asymmetric Broadsheet shell with subjects in a
  sibling strip. The Phase 3-b lock is the more recent decision and
  should hold unless explicitly re-opened with strong cause.
- **All four alternatives required dropping `<EditorialHeroShell>`,
  `<SubjectsStrip>`, or both.** Per `compare.md` vocabulary map:
  A / B / C drop 3 primitives each; D drops 0 but restructures the
  shell from horizontal-side-by-side to vertical-stack. None of these
  net out as worth re-opening a clean, locked, primitive-faithful
  composition.
- **Variant-specific imagery (interview interviewee polaroids,
  transfer crests, event meta strip, match scoreline) can layer ON TOP
  of E0 in their own per-variant drills** without disturbing the
  universal shell. Specifically: `<SubjectsStrip>` already carries
  interview polaroids; the per-variant drill 5.d-int (#1787) is
  scoped to Q&A row + InterviewCredits, NOT the hero — that scope
  is honored.
- **Homepage-consistency rule** (per [[feedback_reuse_approved_primitives]] and owner note 2026-05-17): the homepage hero is `<EditorialHero placement="homepage">` — the same 60/40 shell wrapped in `<a>` for whole-card click. Keeping E0 on detail keeps the chrome register identical between homepage and detail, which is the explicit goal.

## Universal shell scope (locked downstream consumers)

The following variant drills inherit E0 as the universal hero shell:

| Drill           | Variant                   | Layered on top of E0                                                                                        |
| --------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 5.d-int (#1787) | interview                 | `<SubjectsStrip>` (already in E0) + `<QASection>` + `<InterviewCredits>` in body. No header overlay needed. |
| 5.d-col (#1788) | announcement / column     | E0 shell as-is, may keep `<SubjectsStrip>` empty. Variant-specific body in 5.B.col.                         |
| 5.d-tra (#1789) | transfer                  | E0 + `<TransferFactStrip>` below (existing).                                                                |
| 5.d-evt (#1790) | event                     | E0 + `<EventFactStrip>` below (existing).                                                                   |
| 5.d-mat (#1791) | matchPreview / matchRecap | E0 once `<EditorialHero variant="matchPreview/matchRecap" placement="detail">` lands via #1470.             |

## Things this drill resolves

- ✅ "Article header — centered or flanked?" — neither; existing 60/40
  shell stands.
- ✅ "Should polaroids live in the hero or below?" — below, as
  `<SubjectsStrip>` (Phase 3-b lock).
- ✅ "Does `coverImage` live in the hero?" — yes, right column, taped, 16:9 aspect (Phase 3-b lock).

## Things this drill does NOT decide (deferred)

- **Cover-image-missing fallback** — handled in 5.A.1 implementation
  (#1792). Expected: a cream tape-textured block with the same
  kicker / title / lead / byline composition in the left column,
  cover-column collapses (1-column layout).
- **Mobile breakpoint behavior** for the existing shell — covered by
  the locked `lg` breakpoint on `<EditorialHeroShell>`.
- **Per-variant body deltas** — drills 5.d-int / 5.d-col / 5.d-tra /
  5.d-evt / 5.d-mat each handle their own variant-specific body work.

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d1-header/round-1-header-layout-comparisons.html`
- Primitive map: `docs/design/mockups/phase-5-article-detail/5d1-header/compare.md`
- Locks consulted:
  - `docs/design/mockups/phase-3-b-editorial-hero/interview-locked.md`
  - `docs/design/mockups/phase-3-b-editorial-hero/announcement-locked.md`
  - `docs/design/mockups/phase-4-homepage/hero-locked.md`
  - `docs/design/mockups/phase-4-homepage/photo-treatment-system-locked.md`
- Component source: `apps/web/src/components/design-system/EditorialHeroShell/EditorialHeroShell.tsx`
