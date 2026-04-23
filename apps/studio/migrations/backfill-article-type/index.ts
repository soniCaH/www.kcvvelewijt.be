import {defineMigration, at, set} from 'sanity/migrate'

/**
 * Backfill `articleType = "announcement"` on legacy article documents that
 * predate the field. Part of #1334 — final phase of the article-detail
 * redesign milestone.
 *
 * The schema declares `articleType` as required with an initialValue of
 * "announcement", but existing documents created before the field landed
 * don't carry it. Downstream the `page.tsx` renderTemplate default
 * branch already treats missing articleType as announcement (PRD §3), so
 * this migration is a correctness pass, not a behaviour change — editors
 * want the value explicit in Studio so it shows in list/grouping views
 * and validates on subsequent edits.
 *
 * Skips any article that already has articleType set. Tag-signalled
 * interview auto-promotion is NOT done here — it requires editor
 * review per the issue spec. See `apps/web/scripts/audit-interview-
 * candidates.mjs` for the report-only companion.
 *
 * Dry-run first:
 *   npx sanity@latest migration run backfill-article-type --project vhb33jaz --dataset staging --dry-run
 *
 * Apply:
 *   npx sanity@latest migration run backfill-article-type --project vhb33jaz --dataset staging
 *   npx sanity@latest migration run backfill-article-type --project vhb33jaz --dataset production
 */
export default defineMigration({
  title: 'Backfill articleType="announcement" on legacy articles',
  documentTypes: ['article'],

  migrate: {
    document(doc) {
      if (typeof doc.articleType === 'string' && doc.articleType.length > 0) {
        return undefined
      }
      return [at('articleType', set('announcement'))]
    },
  },
})
