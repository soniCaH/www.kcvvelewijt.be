import {at, defineMigration, set} from 'sanity/migrate'

/**
 * Backfill `articleType = "announcement"` on legacy article documents that
 * predate the field (#1334).
 *
 * The schema declares `articleType` as required with an initialValue of
 * "announcement", but documents created before the field landed don't
 * carry it. `page.tsx` already treats a missing articleType as
 * announcement, so this is a correctness pass, not a behaviour change —
 * editors want the value explicit in Studio.
 *
 * Skips any article that already has articleType set. Tag-signalled
 * interview auto-promotion is NOT done here — it requires editor review.
 * See `apps/web/scripts/audit-interview-candidates.mjs` for the report-only
 * companion.
 */
export interface ArticleTypeDoc {
  articleType?: unknown
}

type Patch = ReturnType<typeof at>

export function migrateBackfillArticleType(doc: ArticleTypeDoc): Patch[] | undefined {
  if (typeof doc.articleType === 'string' && doc.articleType.length > 0) return undefined
  return [at('articleType', set('announcement'))]
}

export default defineMigration({
  title: 'Backfill articleType="announcement" on legacy articles',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      return migrateBackfillArticleType(doc as ArticleTypeDoc)
    },
  },
})
