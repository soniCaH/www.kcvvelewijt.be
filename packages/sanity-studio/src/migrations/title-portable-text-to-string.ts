import {at, defineMigration, set} from 'sanity/migrate'

/**
 * ROLLBACK ONLY — never run as a sync. REVERSE of `title-to-portable-text`:
 * flattens any PT title back to a plain string. Production is in the
 * forward (PT) state, so every article there yields a patch; running this
 * flattens every title backwards.
 *
 * Kept for the intermediate-state rollback: when a dataset has advanced
 * past the deployed app code, flatten, deploy, then re-run the forward
 * migration. Idempotent — strings pass through unchanged.
 */
export interface PortableTextTitleArticleDoc {
  title?: unknown
}

type Patch = ReturnType<typeof at>

export function migrateTitlePortableTextToString(
  doc: PortableTextTitleArticleDoc,
): Patch[] | undefined {
  if (!Array.isArray(doc.title)) return undefined
  const block = (doc.title as {children?: {text?: string}[]}[])[0]
  const text = block?.children?.map((c) => c.text ?? '').join('') ?? ''
  if (text.trim().length === 0) return undefined
  return [at('title', set(text))]
}

export default defineMigration({
  title: 'Reverse: convert article.title (PT) → string (rollback only)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      return migrateTitlePortableTextToString(doc as PortableTextTitleArticleDoc)
    },
  },
})
