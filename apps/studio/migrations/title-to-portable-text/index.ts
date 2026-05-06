import {defineMigration, at, set} from 'sanity/migrate'

/**
 * Convert `article.title` from `string` → constrained Portable Text
 * (single block, one `accent` decorator). One-shot data migration. After
 * this migration, every consumer of `article.title` switches to either
 * PT-aware rendering (display contexts) or the `serializeTitle()` /
 * GROQ `pt::text(title)` flatten for plain-string contexts.
 *
 * Spec: docs/design/mockups/phase-3-b-editorial-hero/fields.md Ask 9.
 *
 * The script is idempotent — running twice on the same dataset is a
 * no-op because the second pass sees the title is already an array and
 * skips it.
 *
 * Dry-run first:
 *   npx sanity@latest migration run title-to-portable-text \
 *     --project vhb33jaz --dataset staging --dry-run
 *
 * Apply:
 *   npx sanity@latest migration run title-to-portable-text \
 *     --project vhb33jaz --dataset staging
 *   npx sanity@latest migration run title-to-portable-text \
 *     --project vhb33jaz --dataset production
 */
export default defineMigration({
  title: 'Convert article.title (string) → constrained Portable Text',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      const title = (doc as {title?: unknown}).title
      if (typeof title !== 'string' || title.trim().length === 0) {
        return undefined
      }
      const block = {
        _type: 'block',
        _key: `title_${doc._id.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`,
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: `span_${doc._id.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`,
            text: title,
            marks: [],
          },
        ],
      }
      return [at('title', set([block]))]
    },
  },
})
