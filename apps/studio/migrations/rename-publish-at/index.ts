/**
 * Migration: rename article.publishAt → article.publishedAt
 *
 * Run on staging first, then production:
 *   npx sanity@latest migration run rename-publish-at --project=vhb33jaz --dataset=staging --no-dry-run --no-confirm
 *   npx sanity@latest migration run rename-publish-at --project=vhb33jaz --dataset=production --no-dry-run --no-confirm
 *
 * Idempotent: documents whose `publishAt` is already absent are skipped, and
 * `publishedAt` is only set when missing — re-running is a no-op.
 */
import {defineMigration, at, set, unset} from 'sanity/migrate'

export default defineMigration({
  title: 'Rename article.publishAt to article.publishedAt',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      const d = doc as Record<string, unknown>
      if (d.publishAt === undefined) return undefined

      const ops = []
      if (d.publishedAt === undefined) {
        ops.push(at('publishedAt', set(d.publishAt)))
      }
      ops.push(at('publishAt', unset()))
      return ops
    },
  },
})
