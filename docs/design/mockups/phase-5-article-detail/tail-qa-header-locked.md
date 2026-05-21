# Tail Q&A section header — locked

**Drill:** 5.d-tail-qa-header · Round 1 · #1867
**Locked:** 2026-05-21 by @climacon
**Mockups:** `5d-tail-qa-header/round-1-tail-qa-header-comparisons.html`
**Primitive map:** `5d-tail-qa-header/compare.md`
**Tracker:** #1860 (Phase 5 closeout)
**Implementation spinout:** #1874

---

## Decision

**D — `<EditorialHeading size="display-xl">` with `<HighlighterStroke>`
marker on "Q&A".** Centered, prose-width. No flanking rules, no kicker,
no seam. The heading carries the whole moment.

```text
                      ▓▓▓▓▓
                      Q&A.
```

- `<EditorialHeading size="display-xl" level={2} emphasis={{ text: "Q&A", highlight: true }}>Q&A.</EditorialHeading>`
- Italic Freight Display 700 (`font-display`, `text-display-xl`).
- `<HighlighterStroke color="jersey">` underprints the "Q&A" substring
  (the existing `emphasis.highlight: true` path on `<EditorialHeading>`).
- Centered (`text-align: center`) at prose width
  (`--container-prose: 680px`).
- Period rendered per the existing EditorialHeading convention.

## Rationale

- Owner feedback (2026-05-20 grilling): the existing
  `<MonoLabel tone="ink">Q&A</MonoLabel>` was too quiet between
  `<EndMark>` above and the first tail `<QaPair>` below —
  _"should be other typography, bigger"_.
- Option D delivers the biggest typography of the four and the
  most distinct voice. The `<HighlighterStroke>` marker is the
  system's strongest call-out gesture and signals the tail as a
  feature, not a footnote.
- Option A (kicker + display-md) was rejected as still too quiet —
  the mono kicker risks the same fade-into-cream problem the
  original `<MonoLabel>` had.
- Option B (display-lg + flanking rules) was rejected because the
  thin-rule subtitle vocabulary is already locked at mid-article
  section breaks (5.d3). Reusing it for the tail header — even at
  a larger heading size — risks reading as a continuation of body
  section breaks rather than a new section after `<EndMark>`.
- Option C (full-bleed `<StripedSeam>`) was rejected for the same
  register-shift reason 5.d3 rejected its own option B: every prior
  `<StripedSeam>` usage separates _page regions_, not in-article
  sections. Promoting the tail to a page-region boundary would
  expand `<StripedSeam>`'s remit and set a precedent we don't want.
- Risk acknowledged: display-xl is the InterviewHero headline scale.
  The page lede headline is `<EditorialHeading size="display-xl">`
  (per master plan §5.2 InterviewHero spec). Two display-xl headings
  on the same page is acceptable here because they are separated by
  the entire article body, multiple `<PullQuote>`s, and `<EndMark>`.
  The tail header is the second hero moment by design — it deserves
  the same scale.

## Locked component shape

```tsx
{
  hasTail ? (
    <section
      data-qa-tail-section="true"
      aria-label="Q&A"
      className="bg-cream w-full px-4 pb-12 lg:px-0 lg:pb-16"
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-prose)" }}
      >
        <header className="mb-8 text-center">
          <EditorialHeading
            level={2}
            size="display-xl"
            emphasis={{ text: "Q&A", highlight: true }}
          >
            Q&A.
          </EditorialHeading>
        </header>
        <div className="flex flex-col gap-12">
          {tailBlocks.map((block) => (
            <QaBlock
              key={block._key}
              value={block}
              subjects={article.subjects ?? null}
            />
          ))}
        </div>
      </div>
    </section>
  ) : null;
}
```

- Heading text is hardcoded as `"Q&A."`. The drill explicitly did
  not introduce a Sanity field for editor-controlled copy here —
  the tail header is a structural label, not editorial copy. If a
  future article variant needs a different label, revisit then.
- The `aria-label="Q&A"` on the outer `<section>` continues to
  carry the accessible name (the visible `<h2>` and the section's
  aria-label both saying "Q&A" is intentional; the visible heading
  is what screen readers will announce on heading navigation).
- The `<header>` wrapper drops `flex justify-center` in favour of
  `text-center` — `<EditorialHeading>` is a block-level heading
  and centers via text-align, not flex.

## API impact

- **None.** `<EditorialHeading>` already supports
  `size="display-xl"` + `emphasis={{ text, highlight: true }}` (the
  marker variant landed in Phase 1 — see `EditorialHeading.tsx:34-48`).
- **No new component.** No new prop on `<EditorialHeading>`.
- **No schema migration.** Heading copy stays hardcoded in the page.

## What this drill resolves

- ✅ "What typography for the tail Q&A section header?" — display-xl
  italic + HighlighterStroke marker on "Q&A".
- ✅ "Should the tail header reuse the mid-article section-break
  vocabulary?" — No (option B rejected). Reusing thin-rule subtitle
  at a larger scale would conflate body sections with the tail.
- ✅ "Should `<StripedSeam>` cross into in-article use?" — No (option
  C rejected). Stays at page-region boundaries.
- ✅ "Should there be an editorial kicker / lede subtitle?" — No
  (options A and C rejected). The marker-decorated heading carries
  the whole moment.

## What this drill does NOT decide

- **Tail-section background or framing.** Tail stays on cream like
  the rest of the body. A future round may revisit if the cream-on-
  cream rhythm proves insufficient after seeing the lock in
  production.
- **Mobile typography scale.** Implementation follows the canonical
  `<EditorialHeading>` responsive cascade for `size="display-xl"`
  — verify at PR time with the Storybook viewport stories.
- **`<EndMark>` to header gap.** Vertical rhythm between the in-flow
  body's closing `<EndMark>` and the tail `<section>` is governed
  by the parent `<ArticleBodyMotion>` + the tail section's own
  padding. Tune at implementation if the gap reads wrong; not a
  drill question.
- **Whether other article variants surface a tail Q&A section at
  all.** Currently only used by the interview variant (via
  `qaBlocksToTailSection`). Other variants opt in by adding
  `groupAtTail: true` to qaBlocks at the Sanity level — the
  rendered header treatment is the same.

## Net new primitives

None. Direct reuse of `<EditorialHeading size="display-xl"
emphasis={{ text, highlight: true }}>` — already in the system
since Phase 1.

## Source-of-truth

- Mockup HTML: `docs/design/mockups/phase-5-article-detail/5d-tail-qa-header/round-1-tail-qa-header-comparisons.html`
- Primitive map: `docs/design/mockups/phase-5-article-detail/5d-tail-qa-header/compare.md`
- Current implementation: `apps/web/src/app/(main)/nieuws/[slug]/page.tsx:449-451`
- EditorialHeading source: `apps/web/src/components/design-system/EditorialHeading/EditorialHeading.tsx`
- HighlighterStroke source: `apps/web/src/components/design-system/HighlighterStroke/HighlighterStroke.tsx`
- Phase 3-b interview lock: `docs/design/mockups/phase-5-article-detail/interview-locked.md`
- 5.d3 lock (mid-article breaks): `docs/design/mockups/phase-5-article-detail/section-break-locked.md`
- Memories consumed: [[feedback_reuse_approved_primitives]], [[feedback_visual_preferences]], [[feedback_design_drill_pattern]], [[feedback_drill_visual_then_ia]], [[feedback_monolabel_cream_full_opacity]].
