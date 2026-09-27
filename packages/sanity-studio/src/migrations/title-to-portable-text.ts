import {at, defineMigration, set} from 'sanity/migrate'

/**
 * Convert `article.title` from `string` → constrained Portable Text
 * (single block, one `accent` decorator). After this migration, every
 * consumer of `article.title` uses PT-aware rendering or the
 * `serializeTitle()` / GROQ `pt::text(title)` flatten.
 *
 * Spec: docs/design/mockups/phase-3-b-editorial-hero/fields.md Ask 9.
 *
 * Idempotent — a second pass sees the title is already an array and skips
 * it. `title-portable-text-to-string` is its rollback-only reverse.
 */
export interface StringTitleArticleDoc {
  _id: string
  title?: unknown
}

type Patch = ReturnType<typeof at>

export function migrateTitleToPortableText(doc: StringTitleArticleDoc): Patch[] | undefined {
  const {title} = doc
  if (typeof title !== 'string' || title.trim().length === 0) return undefined

  const keySuffix = doc._id.replace(/[^a-z0-9]/gi, '').slice(0, 12)
  const block = {
    _type: 'block',
    _key: `title_${keySuffix}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `span_${keySuffix}`, text: title, marks: []}],
  }
  return [at('title', set([block]))]
}

export default defineMigration({
  title: 'Convert article.title (string) → constrained Portable Text',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      return migrateTitleToPortableText(doc)
    },
  },
})
