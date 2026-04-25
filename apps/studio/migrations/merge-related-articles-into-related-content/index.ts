/**
 * Copies legacy `article.relatedArticles` references into the unified
 * `article.relatedContent` array (Phase 2 of the related-content extension,
 * #1317), then unsets the legacy field. Idempotent.
 *
 * Logic + tests live in `@kcvv/sanity-studio/migrations` so the migration
 * can be unit-tested against synthetic documents. This file is the Sanity
 * CLI entry point.
 *
 * Dry-run first:
 *   npx sanity@latest migration run merge-related-articles-into-related-content --project vhb33jaz --dataset staging --dry-run
 *
 * Apply:
 *   npx sanity@latest migration run merge-related-articles-into-related-content --project vhb33jaz --dataset staging
 *   npx sanity@latest migration run merge-related-articles-into-related-content --project vhb33jaz --dataset production
 */
import {mergeRelatedArticlesIntoRelatedContentMigration} from '@kcvv/sanity-studio/migrations'

export default mergeRelatedArticlesIntoRelatedContentMigration
