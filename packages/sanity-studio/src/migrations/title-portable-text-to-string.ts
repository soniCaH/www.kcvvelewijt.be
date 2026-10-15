import {at, defineMigration, set} from 'sanity/migrate'
import {firstBlockText} from './article-label'

/**
 * ROLLBACK ONLY — never run as a sync. REVERSE of `title-to-portable-text`:
 * flattens any PT title back to a plain string. Production is in the
 * forward (PT) state, so every article there yields a patch; running this
 * flattens every title backwards.
 *
 * Kept for the intermediate-state rollback: when a dataset has advanced
 * past the deployed app code, flatten, deploy, then re-run the forward
 * migration. Idempotent — strings pass through unchanged.
 *
 * Guarded: `migrate.document` throws unless `ALLOW_TITLE_ROLLBACK=yes`. The
 * guard lives inside the handler, never at module top level — a top-level
 * throw would break the migrations barrel and every studio facade.
 */
export interface PortableTextTitleArticleDoc {
  title?: unknown
}

type Patch = ReturnType<typeof at>

export function migrateTitlePortableTextToString(
  doc: PortableTextTitleArticleDoc,
): Patch[] | undefined {
  if (!Array.isArray(doc.title)) return undefined
  const text = firstBlockText(doc.title) ?? ''
  if (text.trim().length === 0) return undefined
  return [at('title', set(text))]
}

export function assertTitleRollbackAllowed(env: Record<string, string | undefined> = process.env): void {
  if (env.ALLOW_TITLE_ROLLBACK !== 'yes') {
    throw new Error(
      'title-portable-text-to-string is rollback-only: it flattens every article title. Set ALLOW_TITLE_ROLLBACK=yes to run it.',
    )
  }
}

export default defineMigration({
  title: 'Reverse: convert article.title (PT) → string (rollback only)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      assertTitleRollbackAllowed()
      return migrateTitlePortableTextToString(doc as PortableTextTitleArticleDoc)
    },
  },
})
