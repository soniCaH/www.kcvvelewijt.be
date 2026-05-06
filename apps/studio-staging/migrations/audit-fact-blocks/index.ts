import {defineMigration} from 'sanity/migrate'

/**
 * AUDIT-ONLY migration — surfaces articles in violation of the new
 * articleType=event/transfer body validators (≥1 eventFact /
 * transferFact required). Logs slug + title for each offender. Run on
 * staging + production before the schema validator deploys; editorial
 * fills the missing fact blocks; rerun until clean.
 *
 * Spec: fields.md Ask 6.
 *
 *   npx sanity@latest migration run audit-fact-blocks \
 *     --project vhb33jaz --dataset staging --dry-run
 */
export default defineMigration({
  title: 'Audit event/transfer articles missing required fact blocks',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      const articleType = (doc as {articleType?: string}).articleType
      if (articleType !== 'event' && articleType !== 'transfer') return undefined

      const body = ((doc as {body?: {_type?: string}[]}).body ?? []) as {_type?: string}[]
      const requiredType = articleType === 'event' ? 'eventFact' : 'transferFact'
      const hasRequired = body.some((b) => b._type === requiredType)
      if (!hasRequired) {
        const title = (doc as {title?: unknown}).title
        const titleText =
          typeof title === 'string'
            ? title
            : Array.isArray(title)
              ? ((title as {children?: {text?: string}[]}[])[0]?.children
                  ?.map((c) => c.text ?? '')
                  .join('') ?? '(geen titel)')
              : '(geen titel)'
        const slug = (doc as {slug?: {current?: string}}).slug?.current ?? '(geen slug)'
        console.log(`[${articleType} missing ${requiredType}] ${slug} — "${titleText}"`)
      }
      return undefined
    },
  },
})
