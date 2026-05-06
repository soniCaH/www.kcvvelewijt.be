import {defineMigration} from 'sanity/migrate'

/**
 * AUDIT-ONLY migration — surfaces every article missing `coverImage`
 * before the `r.required()` validator deploys. Logs a slug + title list
 * to stdout. The editorial team must upload an image for each offender
 * BEFORE the schema validator activates; anything left blocks re-publish.
 *
 * This script does NOT mutate documents — it just walks them and
 * reports. Run on staging, share the offenders with editorial, run on
 * production immediately before the schema deploy as a final gate.
 *
 * Spec: fields.md Ask 8.
 *
 *   npx sanity@latest migration run audit-coverimage-required \
 *     --project vhb33jaz --dataset staging --dry-run
 *
 * (--dry-run gives the same output as a real run since we don't mutate.)
 */
export default defineMigration({
  title: 'Audit articles missing coverImage (pre Ask-8 backfill gate)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      const ci = (doc as {coverImage?: unknown}).coverImage
      const hasAsset =
        ci !== undefined &&
        ci !== null &&
        typeof ci === 'object' &&
        'asset' in (ci as Record<string, unknown>)
      if (!hasAsset) {
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
        console.log(`[coverImage missing] ${slug} — "${titleText}"`)
      }
      return undefined
    },
  },
})
