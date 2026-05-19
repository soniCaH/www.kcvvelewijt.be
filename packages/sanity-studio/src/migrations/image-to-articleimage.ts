import {at, defineMigration, set, unset} from 'sanity/migrate'

/**
 * Shape-detection + patch description for the Phase 5 article-body
 * `image` → `articleImage` data migration (#1850).
 *
 * Production has 122 legacy articles whose `body[]` carries raw Sanity
 * `image` blocks at the root level. The `article.body` schema only
 * declares `articleImage` (not `image`) in its `of:` array, so the new
 * `<ArticleBody>` PT serializer only registers an `articleImage`
 * serializer — without this backfill, every legacy image would silently
 * disappear from every article when `nieuws/[slug]/page.tsx` switches
 * from `<SanityArticleBody>` to `<ArticleBody>`.
 *
 * Translation rule (locked in `phase-5-article-detail/articleimage-locked.md`):
 *
 *   { _type: 'image',                          { _type: 'articleImage',
 *     _key,                                      _key,
 *     asset: { _ref, _type },          →         image: {
 *     hotspot?, crop?,                              asset: { _ref, _type },
 *     alt?,                                         hotspot?, crop?,
 *     ...legacy keys                             },
 *   }                                            alt?,
 *                                                width: 'prose',
 *                                              }
 *
 * The asset reference + hotspot + crop are lifted under a new nested
 * `image` field (matching the `articleImage` schema's `image` object
 * field). `alt` is preserved as a top-level field. `width` defaults to
 * `'prose'` (the locked default; editors can flip individual images to
 * `'wide'` or `'bleed'` in the Studio post-migration).
 *
 * Idempotent: blocks already `_type === 'articleImage'` are left alone.
 *
 * Exported separately from `defineMigration` so unit tests can exercise
 * the branching against synthetic documents without a Sanity dataset.
 */
export interface ImageAssetRef {
  _ref?: string
  _type?: string
}

export interface ImageHotspot {
  x?: number
  y?: number
  height?: number
  width?: number
  _type?: string
}

export interface ImageCrop {
  top?: number
  bottom?: number
  left?: number
  right?: number
  _type?: string
}

export interface LegacyImageBlock {
  _key?: string
  _type?: string
  asset?: ImageAssetRef
  hotspot?: ImageHotspot
  crop?: ImageCrop
  alt?: string
}

export interface ArticleWithImageBlocksDoc {
  _id?: string
  _type?: string
  body?: unknown
}

type Patch = ReturnType<typeof at>

function asLegacyImageBlock(value: unknown): LegacyImageBlock | null {
  if (typeof value !== 'object' || value === null) return null
  const block = value as LegacyImageBlock
  if (block._type !== 'image') return null
  return block
}

export function migrateImageToArticleImage(
  doc: ArticleWithImageBlocksDoc,
): Patch[] | undefined {
  const body = Array.isArray(doc.body) ? doc.body : null
  if (!body) return undefined

  const patches: Patch[] = []

  for (const blockRaw of body) {
    const block = asLegacyImageBlock(blockRaw)
    if (!block) continue
    const blockKey = block._key
    if (!blockKey) continue

    const pathRoot = `body[_key=="${blockKey}"]`

    // Flip the discriminator first. `_type` is the field GROQ + the PT
    // renderer route on; once it's `articleImage`, downstream is happy
    // regardless of which order Sanity applies the remaining patches.
    patches.push(at(`${pathRoot}._type`, set('articleImage')))

    // Lift the asset ref + (optional) hotspot/crop into the nested
    // `image` field that the `articleImage` schema declares. We rebuild
    // the inner object as a single `set` rather than emitting one patch
    // per sub-field — keeps the patch list short and avoids the
    // "set a child of a missing parent" race that staged patches can
    // hit on Sanity's apply path.
    const innerImage: Record<string, unknown> = {
      _type: 'image',
    }
    if (block.asset) innerImage.asset = block.asset
    if (block.hotspot) innerImage.hotspot = block.hotspot
    if (block.crop) innerImage.crop = block.crop
    patches.push(at(`${pathRoot}.image`, set(innerImage)))

    // Lift `alt` to a top-level field on the new articleImage shape.
    // Omitted when the legacy block didn't carry one — the schema's
    // `alt` validator is `.warning()` not `.error()`, so a missing
    // `alt` post-migration nudges editors without blocking publish.
    if (typeof block.alt === 'string' && block.alt.length > 0) {
      patches.push(at(`${pathRoot}.alt`, set(block.alt)))
    }

    // Default `width` to 'prose' per the locked R3 enum in
    // `articleimage-locked.md`. Editors can override to 'wide' or
    // 'bleed' in the Studio post-migration; no per-image heuristic.
    patches.push(at(`${pathRoot}.width`, set('prose')))

    // Unset the legacy root-level fields that aren't part of the new
    // `articleImage` shape. The asset / hotspot / crop have been
    // moved into the nested `image` field above; leaving the originals
    // in place would leave the document with both a legacy `asset` at
    // the root AND a fresh `image.asset` — the schema would silently
    // ignore the root one but the data would be inconsistent.
    patches.push(at(`${pathRoot}.asset`, unset()))
    if (block.hotspot) patches.push(at(`${pathRoot}.hotspot`, unset()))
    if (block.crop) patches.push(at(`${pathRoot}.crop`, unset()))
  }

  return patches.length > 0 ? patches : undefined
}

export default defineMigration({
  title: 'Migrate legacy `image` body blocks → `articleImage` (#1850)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      return migrateImageToArticleImage(doc as ArticleWithImageBlocksDoc)
    },
  },
})
