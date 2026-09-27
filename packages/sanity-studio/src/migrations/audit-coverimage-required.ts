import {defineMigration} from 'sanity/migrate'
import {articleLabel, type LabelledArticleDoc} from './article-label'

/**
 * AUDIT-ONLY migration — surfaces every article missing `coverImage`
 * before the `r.required()` validator deploys. Logs a slug + title list
 * to stdout. The editorial team must upload an image for each offender
 * BEFORE the schema validator activates; anything left blocks re-publish.
 *
 * This script does NOT mutate documents — it just walks them and
 * reports. Spec: fields.md Ask 8.
 *
 * `auditCoverImageRequired` is the pure check (returns the log line, or
 * `undefined` for a clean article) so tests can run it without a dataset.
 */
export interface CoverImageArticleDoc extends LabelledArticleDoc {
  coverImage?: unknown
}

export function auditCoverImageRequired(doc: CoverImageArticleDoc): string | undefined {
  const ci = doc.coverImage
  const hasAsset = ci !== undefined && ci !== null && typeof ci === 'object' && 'asset' in ci
  return hasAsset ? undefined : `[coverImage missing] ${articleLabel(doc)}`
}

export default defineMigration({
  title: 'Audit articles missing coverImage (pre Ask-8 backfill gate)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      const line = auditCoverImageRequired(doc as CoverImageArticleDoc)
      if (line) console.log(line)
      return undefined
    },
  },
})
