import {defineMigration, at, set} from 'sanity/migrate'

/**
 * REVERSE of `title-to-portable-text` — flattens any PT title back to a
 * plain string. Used when the staging dataset has advanced past the
 * staging app code (intermediate-state rollback). Re-run the forward
 * migration after the PR merges and the new code deploys.
 *
 * Idempotent — strings pass through unchanged.
 *
 *   npx sanity@latest migration run title-portable-text-to-string \
 *     --project vhb33jaz --dataset staging --no-confirm --dry-run
 */
export default defineMigration({
  title: 'Reverse: convert article.title (PT) → string (rollback only)',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      const title = (doc as {title?: unknown}).title
      if (!Array.isArray(title)) return undefined
      const block = (title as {children?: {text?: string}[]}[])[0]
      const text = block?.children?.map((c) => c.text ?? '').join('') ?? ''
      if (text.trim().length === 0) return undefined
      return [at('title', set(text))]
    },
  },
})
