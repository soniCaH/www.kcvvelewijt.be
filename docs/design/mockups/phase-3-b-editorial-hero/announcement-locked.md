# `<EditorialHero variant="announcement">` — locked design (Phase 3, Checkpoint B)

**Status:** ✅ owner-approved 2026-05-05.
**Issue:** #1525 · sub-issue 3.B.2 (variants).
**Mockup:** `option-a-announcement-detail.html` + screenshots `screenshots/detail-announcement-{full,no-cover,with-cover}.png`.
**Field availability sheet:** `fields.md` (gates the rendered fields).

## Scope

Detail-page hero for `/nieuws/[slug]` when `articleType === "announcement"`. Renders at the top of the article; body flows directly below. **No click-through CTAs** — the reader is already on the article. Homepage placement (with CTA row) layers on top of this spec via the `placement="homepage"` extension (Phase 3 B follow-up, not blocking).

## Composition

### Shell

Locked direction A — Asymmetric Broadsheet (60/40 grid, ink rule between text and artefact column). Shared across **all four** article-type variants — different artefact, same shell.

```text
┌──────────────────────────────────────────────┬───────────────────────────┐
│  EditorialKicker (60%)                       │                           │
│  EditorialHeading (PT-aware, accent)         │   HeroCoverImage          │
│  EditorialLead                               │   (TapedCard rotation A   │
│  EditorialByline                             │    + 16:9 image)          │
│                                              │                           │
└──────────────────────────────────────────────┴───────────────────────────┘
                                            ↓
                            article body in --container-prose
                            (DropCapParagraph, paragraphs, articleImage,
                             videoBlock, fileAttachment, htmlTable, qaBlock,
                             etc. — same as today)
```

### Slots

| Slot           | Content (announcement)                           | Source                                                                            |
| -------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Kicker         | `★ MEDEDELING · {readingTime} · {publishedAt} ★` | Static articleType label + `computeReadingTime(body)` + `formatDate(publishedAt)` |
| Heading        | Article title with optional accent decorator     | `article.title` (PT after Ask 9 migration)                                        |
| Lead           | Short summary                                    | `article.lead ?? firstParagraphOf(article.body, max=280)`                         |
| Byline         | `★ DOOR REDACTIE`                                | `article.author ?? "Door redactie"` constant                                      |
| Right artefact | Cover image at 16:9 in TapedCard rotation A      | `article.coverImage` (required after Ask 8 migration)                             |

## Component composition — reuse existing, share where new

**Existing primitives used verbatim:**

| Primitive            | Source                                                    | Use                                                                                                        |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `<TapedCard>`        | `apps/web/src/components/design-system/TapedCard/`        | Wraps the cover image artefact (rotation `a`)                                                              |
| `<TapedFigure>`      | `apps/web/src/components/design-system/TapedFigure/`      | Composes TapedCard + `<img>` + caption at `aspect="landscape-16-9"`                                        |
| `<MonoLabel>`        | `apps/web/src/components/design-system/MonoLabel/`        | Building block for kicker labels                                                                           |
| `<MonoLabelRow>`     | `apps/web/src/components/design-system/MonoLabelRow/`     | Inline row of MonoLabels with configurable divider glyph                                                   |
| `<DropCapParagraph>` | `apps/web/src/components/design-system/DropCapParagraph/` | First body paragraph with oversized initial — used in body, not hero, but ships in the same article render |

**Existing primitive needing update (Ask 9 fallout):**

- `<EditorialHeading>` — currently uses substring matching (`emphasis.text: string`). After Ask 9 lands, it must accept the constrained Portable Text shape and serialise the `accent` decorator span as italic + jersey-deep. Migration: deprecate the substring-matching path, add a `title: PortableTextBlock[]` overload (or replace the prop entirely if no other callers remain).

**New shared sub-components (built once, used by all 4 variants):**

| New component          | Purpose                                                                                                   | Composition                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `<EditorialHero>`      | Top-level hero with discriminated union variant prop + placement prop                                     | 60/40 grid + ink rule + slots                                                                        |
| `<EditorialHeroShell>` | Just the 60/40 grid + ink rule. Used internally by `<EditorialHero>` and exposed for the rare custom case | CSS grid + pseudo-element rule                                                                       |
| `<EditorialKicker>`    | Kicker row with star sandwich and dot-separated MonoLabels                                                | `<MonoLabelRow divider="·">` wrapped in leading + trailing `★` glyphs aligned via flex+line-height-1 |
| `<EditorialLead>`      | Italic display paragraph, max-width ~52ch                                                                 | `<p>` with design tokens; ships truncate-to-280 helper for body-fallback case                        |
| `<EditorialByline>`    | Author row at hero foot — leading star + author string                                                    | Mono caps + leading ★ glyph; future: secondary action slot for share/copy-link                       |
| `<HeroCoverImage>`     | Cover image artefact for variants where coverImage is the right-column piece                              | `<TapedCard rotation>` + `<TapedFigure aspect="landscape-16-9">`                                     |

**Why these specific sub-components and not just inline JSX:**

- Every variant uses Kicker + Heading + Lead + Byline. Identical markup, identical styling. Extract once, reuse 4×.
- HeroCoverImage is shared between announcement (image only), event (image + ticketstub overlay), and possibly transfer/interview when their primary artefact incorporates the cover.
- The shell stays variant-agnostic so adding a 5th variant (matchPreview/matchRecap from #1470) doesn't fork it.

## Field-source map

Per `fields.md` decisions. Every rendered element traces to a real source.

| UI element            | Source                                                                                         | Notes                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Kicker · "MEDEDELING" | static label keyed off `articleType==='announcement'`                                          | Star-sandwich is a `<EditorialKicker>` constant                                                      |
| Kicker · reading time | `computeReadingTime(article.body)` (existing util at `apps/web/src/lib/utils/reading-time.ts`) | Hides when undefined (≤ 20 words)                                                                    |
| Kicker · date         | `formatDate(article.publishedAt)`                                                              | Format "DD MMM YYYY"                                                                                 |
| Headline              | `article.title` (PT, post-Ask-9)                                                               | Renders accent decorator as italic + jersey-deep span; auto-appends jersey-deep period via `::after` |
| Lead                  | `article.lead` (post-Ask-1) → fallback to `body[0]` first paragraph (truncate ~280 chars)      | Italic display                                                                                       |
| Byline                | `article.author ?? "Door redactie"`                                                            | Default stub; future article.author override (Ask 2 follow-up, non-blocking)                         |
| Right artefact        | `article.coverImage` at 16:9 (post-Ask-8 required)                                             | TapedCard rotation A; alt = `serializeTitle(article.title)`                                          |

## Mobile collapse

Below 768px, the right-column artefact moves **above** the headline (per shell rule consistent with all phase-3 hero compositions). Image stays meaningful size; caption + byline shrink. Kicker reflows compact (drop the star sandwich, keep dot-separated labels). Detailed mobile spec lands in `compose.md` after all 4 variants lock — same composition, different breakpoint.

## API (target shape post-Ask-8 + Ask-9 migrations)

```typescript
type EditorialHeroAnnouncementProps = {
  variant: "announcement";
  placement?: "detail" | "homepage"; // default "detail"
  article: {
    title: PortableTextBlock[]; // single block, accent decorator only
    lead?: string; // optional, falls back to body[0]
    body: PortableTextBlock[]; // for fallback + reading time
    publishedAt: string; // datetime
    coverImage: { url: string; hotspot?: { x: number; y: number } };
    author?: string; // future override; falls back to "Door redactie"
  };
};
```

The component is part of the discriminated union over `variant` — final shape across all four article variants gets pinned in `compose.md` once they all lock.

## Schema dependencies (BLOCKING)

This variant's lock depends on all five blocking schema migrations from `fields.md`:

1. `article.lead` field added.
2. `articleType=event` body validator (eventFact required).
3. `articleType=transfer` body validator (transferFact required).
4. `article.coverImage` becomes required (Ask 8).
5. `article.title` converted to constrained Portable Text + `accent` decorator (Ask 9).

Capture all 5 as hard prerequisites for sub-issue `3.B.2` in the GitHub issue split.

## Reuse mandate (owner direction 2026-05-05)

> Re-use as many existing Storybook components as possible for kicker/byline/dropcap, and create shareable components where possible between all variants.

Implementation rules:

1. **Audit before building.** Before writing any new component for any of the four variants, grep `apps/web/src/components/design-system/` for an existing primitive that fits. Use it; don't reinvent.
2. **Extract before duplicating.** Any markup or styling that appears in 2+ variants becomes a shared sub-component (Kicker / Lead / Byline / HeroCoverImage / Shell). Don't ship per-variant copy-paste.
3. **Storybook coverage on every shared sub-component.** Each new sub-component ships with `<Name>.stories.tsx` (title `UI/<Name>`), VR-tagged, `vr` tag in meta. Per `apps/web/CLAUDE.md` §"Design System & Storybook (MANDATORY)".
4. **No hidden state.** Sub-components are pure presentational — no fetching, no Effect, no hooks beyond what's needed. Article data flows in as props from the page-level Server Component.

## Open follow-ups (non-blocking)

- **Cover caption row** — current mockup shows "★ FOTO · article.coverImage @ 16:9" as a dev-facing caption. Production renders need a real caption decision: drop entirely, render a `coverImageCaption` field (would need new schema field — defer), or render a default "★ FOTO" when uploaded. Decide during 3.B.2 implementation; default = drop the caption row entirely (cleanest).
- **Cover image rotation** — locked to rotation `a` for announcement. If multiple announcements appear adjacent (homepage feed), TapedCardGrid auto-rotation (per `feedback_reuse_approved_primitives` memory) will pick a different rotation per slot. Single-hero placement (detail page) stays rotation `a`.
- **Long titles** — clamp(40px, 5.2vw, 64px) wraps cleanly to ~80 chars. Acknowledge the soft 60-char editorial guideline in the field description but don't enforce.

## Approval checklist

- [x] Asymmetric Broadsheet shell (locked direction A).
- [x] Detail placement — no click-through CTAs.
- [x] coverImage in right column (replaces dropped StampBadge).
- [x] EditorialKicker · star sandwich + dot-separated mono labels, glyph alignment correct.
- [x] EditorialHeading PT-aware (accent decorator, post-Ask-9).
- [x] EditorialLead from `lead` field with body[0] fallback.
- [x] EditorialByline · default "Door redactie" stub.
- [x] No fabricated fields.
- [x] All 5 blocking schema migrations captured for the issue split.
- [x] Reuse mandate captured (existing primitives + new shared sub-components).

## Homepage placement (`placement="homepage"`)

Locked 2026-05-05 — see `option-a-homepage-placement-comparisons.html` (P3 picked from P1/P2/P3 drill).

When the EditorialHero renders as a featured-article teaser at the top of the homepage's news section, the shell + slots above stay **identical to the detail-page composition**. One extension: **whole-card click**.

- The entire hero is wrapped as a link to `/nieuws/{article.slug}`.
- **At rest**: identical to the detail-page hero — kicker, heading, lead, byline, right-column artefact unchanged. No CTA text, no extra band, no inline read-more affordance.
- **On hover**: card press-ups (`transform: translate(-2px, -2px)` + box-shadow grown by ~4px) — the natural inverse of the canonical press-down hover used on paper-stamped primitives. A small `★ Lees verder →` hint fades in at the bottom-right.
- **Body content does not render in homepage placement.** Anything below the hero in the detail spec (article body, factStrips, Q&A divider, EndMark) is article-detail-only.
- **Touch-device note**: no hover means the press-up + hint never trigger. The whole card is clickable; native touch tap navigates. Acceptable starting point; revisit with a persistent foot-line hint if analytics show click-through underperforms.
- **`<EditorialHero>` discriminated union**: `placement?: "detail" | "homepage"` (default `"detail"`). `"homepage"` triggers the `<a>` wrap + press-up styling + body content suppression in the Server Component.
