import {at, defineMigration, set, unset} from 'sanity/migrate'

/**
 * Copies legacy `article.relatedArticles` references into the unified
 * `article.relatedContent` array introduced in Phase 1 (#1316) and extended
 * in Phase 2 (#1317), then unsets the legacy field. Order is preserved;
 * any item that already exists in `relatedContent` (by `_ref`) is not
 * duplicated. Idempotent — re-running on a migrated doc is a no-op.
 *
 * Logic + tests live here so synthetic documents can exercise the patch
 * shape without a Sanity dataset. The CLI entry points re-export
 * `mergeRelatedArticlesIntoRelatedContentMigration`.
 */
export interface RelatedRef {
  _type?: 'reference'
  _ref?: string
  _key?: string
  [k: string]: unknown
}

export interface ArticleDoc {
  _id?: string
  _type?: string
  relatedArticles?: unknown
  relatedContent?: unknown
}

type Patch = ReturnType<typeof at>

const DEFAULT_KEY_LENGTH = 12
const KEY_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function defaultGenKey(): string {
  let out = ''
  for (let i = 0; i < DEFAULT_KEY_LENGTH; i += 1) {
    out += KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)]
  }
  return out
}

function isRelatedRef(value: unknown): value is RelatedRef {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as RelatedRef)._ref === 'string' &&
    (value as RelatedRef)._ref!.length > 0
  )
}

function takeRelatedRefs(value: unknown): RelatedRef[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRelatedRef)
}

export function migrateMergeRelatedArticlesIntoRelatedContent(
  doc: ArticleDoc,
  genKey: () => string = defaultGenKey,
): Patch[] | undefined {
  const legacy = takeRelatedRefs(doc.relatedArticles)

  // No legacy data — nothing to migrate. The legacy field may exist as an
  // empty array on some docs; leave it alone (migration is data-preserving,
  // not a schema cleanup).
  if (legacy.length === 0) return undefined

  const existing = takeRelatedRefs(doc.relatedContent)
  const seenRefs = new Set(existing.map((item) => item._ref))

  // Dedupe legacy refs against `existing` AND against each other on the way
  // through. A legacy array containing two refs to the same article (rare
  // but possible — Sanity HTTP writes bypass Studio's UI guard) would
  // otherwise produce two `relatedContent` entries with the same `_ref` and
  // trip the new array-level dedupe validator on the next save.
  const additions: Array<{_key: string; _type: 'reference'; _ref: string}> = []
  for (const item of legacy) {
    const ref = item._ref!
    if (seenRefs.has(ref)) continue
    seenRefs.add(ref)
    // Regenerate `_key` so two arrays merging never collide. Original
    // `_key`s in `relatedArticles` are scoped to that array — Sanity
    // requires uniqueness within the destination array.
    additions.push({_key: genKey(), _type: 'reference', _ref: ref})
  }

  const merged = [...existing, ...additions]

  return [at('relatedContent', set(merged)), at('relatedArticles', unset())]
}

export default defineMigration({
  title:
    'Merge article.relatedArticles into article.relatedContent (#1317 — Phase 2)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      return migrateMergeRelatedArticlesIntoRelatedContent(doc as ArticleDoc)
    },
  },
})
