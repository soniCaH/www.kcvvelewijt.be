/**
 * Migration: rename article.publishAt → article.publishedAt
 *
 * Run on staging first, then production:
 *   npx sanity@latest migration run rename-publish-at --dataset=staging
 *   npx sanity@latest migration run rename-publish-at --dataset=production
 *
 * Idempotent: documents that already have publishedAt set are skipped.
 */
import {defineMigration, patch, unset} from 'sanity/migrate'

export default defineMigration({
  title: 'Rename article.publishAt to article.publishedAt',
  documentTypes: ['article'],

  migrate: {
    document(doc, _context) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = doc as any

      if (!('publishAt' in d)) return undefined

      return [
        patch(doc._id, [
          {setIfMissing: {publishedAt: d.publishAt}},
          unset(['publishAt']),
        ]),
      ]
    },
  },
})
