# articleImage / image — locked (drill 5.d-img / #1840 drill 3)

**Drill:** 5.d-img · Four visual rounds + aspect default · #1840 drills 3.1 + 3.2
**Locked:** 2026-05-19 by @climacon
**Mockups:**

- `5d-img/round-1-figure-register-comparisons.html`
- `5d-img/round-2-caption-credit-comparisons.html`
- `5d-img/round-3-fullbleed-comparisons.html`
- `5d-img/round-3b-width-mobile-comparisons.html`

---

> This lock supersedes the legacy `ArticleImageBlock` in `SanityArticleBody.tsx` (no caption / boolean fullBleed / 800×450 fallback). The locked rendering uses the existing `<TapedFigure>` design-system primitive, drives caption + credit from per-asset Sanity metadata, and replaces `fullBleed: boolean` with `width: 'prose' | 'wide' | 'bleed'`.

## What this drill resolves

- ✅ **R1 — Figure register:** Option B (flat TapedFigure, no rotation, single tape strip top-center).
- ✅ **R2 — Caption + credit:** per-asset Sanity metadata (`asset->description` → caption, `asset->creditLine` → credit). No schema migration on `articleImage`.
- ✅ **R3 — fullBleed flag:** Option D (replace with `width: 'prose' | 'wide' | 'bleed'` enum).
- ✅ **R3b — Width mobile fallback:** Mobile 1 (wide collapses to prose on mobile; bleed stays bleed).
- ✅ **Aspect default:** `aspect="auto"` (photo's native dimensions from `asset.metadata.dimensions`) + 70vh max-height clamp.

## What this drill does NOT decide

- **EXIF auto-extraction** — explicitly rejected by the owner. We do NOT enable `options.metadata: ['exif']` on the image type.
- **Article-wide photographer override** — `article.photographer` (locked drill 5.d-int R2) keeps feeding `<ArticleCredits>` "Beeld" row; per-figure `asset->creditLine` only renders inline below the figure. No precedence rule needed — they're different surfaces.
- **PortableText caption** — rejected in R2 in favour of plain string `asset->description`. If editors need inline links in a caption, that's a follow-up.

## Locked field rendering

### `articleImage` object (unchanged schema)

```typescript
defineType({
  name: 'articleImage',
  fields: [
    {name: 'image', type: 'image', options: {hotspot: true}, validation: required()},
    {name: 'alt', type: 'string', validation: required().warning()},
    {name: 'width', type: 'string', options: {list: ['prose', 'wide', 'bleed']}, initialValue: 'prose'},
    // fullBleed: boolean — REMOVED in migration
  ],
})
```

**Migration required:**

```typescript
// translate fullBleed → width
fullBleed === true  → width: 'bleed'
fullBleed !== true  → width: 'prose'
unset fullBleed in all articleImage objects
```

### Asset-side metadata (no schema change; built-in Sanity fields)

The renderer reads these from `image.asset->`. All optional:

| Asset field | Visible? | Render slot | Notes |
| --- | --- | --- | --- |
| `asset->description` | ✅ if present | `<figcaption>` caption (italic Freight body-sm) | Editor sets in Studio asset detail view |
| `asset->creditLine` | ✅ if present | `<figcaption>` credit (mono caps ink-muted, right side) | Editor sets in Studio asset detail view |
| `asset->title` | ❌ internal only | Used in Studio asset browser; can fall back as `alt` if articleImage.alt is empty (preview/dev only — required validation should catch this) | |
| `asset->metadata.dimensions` | — | Drives `aspect="auto"` natural ratio + Next.js Image `width`/`height` | Always present |

### GROQ projection

`articleImage` projections must extend the asset selection:

```groq
*[_type == "article" && slug.current == $slug][0]{
  ...,
  body[]{
    ...,
    _type == "articleImage" => {
      ...,
      image{
        ...,
        asset->{
          _id,
          url,
          metadata{dimensions, lqip},
          title,
          description,
          creditLine
        }
      }
    }
  }
}
```

The existing article repository's body projection at `apps/web/src/lib/repositories/article.repository.ts` needs extension.

### Renderer behaviour

```tsx
<TapedFigure
  aspect="auto"
  tape={{ color: 'ochre', length: 'sm', position: 'top-center', rotation: -2 }}
  caption={asset.description ?? undefined}
  credit={asset.creditLine ?? undefined}
  bg="cream"
  tint="newsprint"
  // width=prose → max-width: var(--container-prose) (default behaviour)
  // width=wide  → max-width: var(--container-wide) (NEW token, ~1040px)
  // width=bleed → full-bleed escape via `mx-[calc(50%-50vw)] max-w-[100vw]`
>
  <Image
    src={asset.url}
    alt={articleImage.alt ?? ''}
    width={asset.metadata.dimensions.width}
    height={asset.metadata.dimensions.height}
    style={{ maxHeight: '70vh', objectFit: 'contain' }}
    sizes={width === 'bleed' ? '100vw' : width === 'wide' ? '(max-width: 640px) 100vw, 1040px' : '(max-width: 640px) 100vw, 680px'}
  />
</TapedFigure>
```

**Width rules:**

- `prose` (default, 680px) — figure inside `--container-prose`, single tape strip, figcaption visible
- `wide` (~1040px) — figure breaks out to a new `--container-wide` token; tape stays, figcaption stays. On mobile (`< 640px`) collapses to prose-width
- `bleed` (100vw) — figure breaks to full viewport; **tape suppressed** (looks wrong on viewport-wide photos); figcaption stays at prose width, centered below the photo

**70vh max-height clamp:** every figure (regardless of width) caps the rendered photo height at `70vh`. Prevents a portrait phone-photo from filling the entire desktop viewport. The figure container uses `object-fit: contain` so the photo letterboxes inside the clamp rather than cropping.

### Tape behaviour

- `prose` / `wide`: single ochre tape strip, ~92px wide, centered top edge, rotated -2°.
- `bleed`: no tape (suppressed).
- Tape color is the same ochre as the eventFact inline polaroid (drill 2.1 R1 lock) — single tape vocabulary across the body.

### Component contract

The Phase 5 `<ArticleBody>` PT serializer routes `articleImage` to a new internal renderer (or directly to `<TapedFigure>` with the props above). No new design-system primitive — `<TapedFigure>` already exists and is unchanged.

**Storybook stories required** (per `feedback_state_coverage_stories`):
- prose width · landscape native · with caption + credit
- prose width · portrait native (tall photo, 70vh clamp triggers)
- wide width · landscape · with caption only (no credit)
- bleed · landscape · no caption/credit (asset has none)
- prose · no caption / no credit (figcaption omitted entirely)
- mobile viewport · prose / wide collapsed / bleed (Round 3b lock)

## Net new vocabulary / schema

- **Schema:** remove `articleImage.fullBleed` boolean, add `articleImage.width: 'prose' | 'wide' | 'bleed'`. One Sanity migration (staging + production).
- **Tokens:** new `--container-wide: 1040px` token (additive; doesn't replace anything).
- **Component:** `<ArticleImageBlock>` Phase 5 renderer (sibling to the legacy one in `SanityArticleBody`). No new design-system primitive.
- **Editor workflow:** editors get a width dropdown (prose / wide / bleed) on each image block. Caption + credit are set on the **asset** in the Studio asset detail view (one-time per upload), not on each usage.

## Downstream impact

- **#1829 (5.B body migration)** — this drill unblocks the `<ArticleBody>` articleImage serializer wiring. The migration ships the new renderer + the Sanity migration + the GROQ projection extension.
- **Legacy `ArticleImageBlock`** — stays in `SanityArticleBody.tsx` until that renderer retires. Existing articles read fine via the fullBleed → width translation done in the migration.
- **`article.repository.ts`** — extend body projection's articleImage selection to include `asset->{title, description, creditLine, metadata}`.
- **Studio UX (referenced in `project_sanity_studio_ux_rework`)** — surfacing `asset->description` and `asset->creditLine` to editors is part of the broader Studio UX rework, not blocking this drill.

## Source-of-truth

- Mockup HTML: paths listed above.
- Schema: `packages/sanity-schemas/src/articleImage.ts` (migration in same PR as #1829).
- Existing reference: `apps/web/src/components/design-system/TapedFigure/TapedFigure.tsx` (unchanged primitive).
- Legacy renderer being replaced: `apps/web/src/components/article/SanityArticleBody/SanityArticleBody.tsx:62-80` (`ArticleImageBlock`).
- Memories consumed: `feedback_reuse_approved_primitives`, `feedback_sanity_migrations`, `feedback_design_data_audit`, `feedback_state_coverage_stories`.
