import {defineMigration} from 'sanity/migrate'
import {articleLabel, type LabelledArticleDoc} from './article-label'

/**
 * AUDIT-ONLY migration — surfaces articles in violation of the
 * articleType=event/transfer body validators (≥1 eventFact /
 * transferFact required). Logs slug + title for each offender; editorial
 * fills the missing fact blocks; rerun until clean. Spec: fields.md Ask 6.
 *
 * `auditFactBlocks` is the pure check (returns the log line, or
 * `undefined` for a clean article) so tests can run it without a dataset.
 */
export interface FactBlockArticleDoc extends LabelledArticleDoc {
  articleType?: string
  body?: {_type?: string}[]
}

export function auditFactBlocks(doc: FactBlockArticleDoc): string | undefined {
  const {articleType} = doc
  if (articleType !== 'event' && articleType !== 'transfer') return undefined

  const requiredType = articleType === 'event' ? 'eventFact' : 'transferFact'
  if ((doc.body ?? []).some((b) => b._type === requiredType)) return undefined
  return `[${articleType} missing ${requiredType}] ${articleLabel(doc)}`
}

export default defineMigration({
  title: 'Audit event/transfer articles missing required fact blocks',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      const line = auditFactBlocks(doc as FactBlockArticleDoc)
      if (line) console.log(line)
      return undefined
    },
  },
})
