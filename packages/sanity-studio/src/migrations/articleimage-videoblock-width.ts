import {at, defineMigration, set, unset} from 'sanity/migrate'

/**
 * Shape-detection + patch description for the Phase 5 article-body
 * `articleImage` + `videoBlock` width migration (#1843).
 *
 * The legacy shape on each of these blocks was:
 *
 *   { ..., fullBleed?: boolean }
 *
 * The new shape is:
 *
 *   { ..., width: 'prose' | 'wide' | 'bleed' }
 *
 * Translation rule (locked in `phase-5-article-detail/articleimage-locked.md`
 * + `videoblock-locked.md`):
 *
 *   fullBleed === true                       → width: 'bleed'
 *   fullBleed === false (or missing/null)    → width: 'prose'
 *
 * The legacy `fullBleed` field is unset after the patch so the schema
 * (which no longer declares it) stays authoritative. We always emit the
 * unset patch — even when `fullBleed` was `false` or missing — because
 * Sanity treats `false` as a real stored value distinct from "not set".
 *
 * Idempotent: if `width` is already set on a block, the block is left
 * alone. Useful for re-runs after partial application or when the
 * staging dataset is migrated before production.
 *
 * Exported separately from `defineMigration` so unit tests can exercise
 * the branching against synthetic documents without a Sanity dataset.
 */
export interface BlockWithWidthLike {
  _key?: string
  _type?: string
  fullBleed?: unknown
  width?: unknown
}

export interface ArticleWithWidthBlocksDoc {
  _id?: string
  _type?: string
  body?: unknown
}

type Patch = ReturnType<typeof at>

const TARGET_TYPES = new Set(['articleImage', 'videoBlock'])

function asTargetBlock(value: unknown): BlockWithWidthLike | null {
  if (typeof value !== 'object' || value === null) return null
  const block = value as BlockWithWidthLike
  if (typeof block._type !== 'string' || !TARGET_TYPES.has(block._type)) {
    return null
  }
  return block
}

export function migrateArticleImageVideoBlockWidth(
  doc: ArticleWithWidthBlocksDoc,
): Patch[] | undefined {
  const body = Array.isArray(doc.body) ? doc.body : null
  if (!body) return undefined

  const patches: Patch[] = []

  for (const blockRaw of body) {
    const block = asTargetBlock(blockRaw)
    if (!block) continue
    const blockKey = block._key
    if (!blockKey) continue

    // Idempotent: a block that already has `width` set is treated as
    // already migrated and left alone (including any lingering
    // `fullBleed` field). Documented behaviour — keeps re-runs safe
    // and avoids overwriting an editor-chosen `wide` value with a
    // stale `fullBleed` translation.
    if (typeof block.width === 'string' && block.width.length > 0) continue

    const nextWidth = block.fullBleed === true ? 'bleed' : 'prose'
    const pathRoot = `body[_key=="${blockKey}"]`
    patches.push(at(`${pathRoot}.width`, set(nextWidth)))
    // Always unset the legacy `fullBleed` field, even when it was
    // missing/`false`. Sanity stores `false` as a real boolean value
    // distinct from "not set", so a conditional unset (gated on
    // `fullBleed === true`) would leave `false`/`null` stragglers
    // in the document.
    patches.push(at(`${pathRoot}.fullBleed`, unset()))
  }

  return patches.length > 0 ? patches : undefined
}

export default defineMigration({
  title:
    'Migrate articleImage.fullBleed + videoBlock.fullBleed → width enum (#1843)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      return migrateArticleImageVideoBlockWidth(doc as ArticleWithWidthBlocksDoc)
    },
  },
})
