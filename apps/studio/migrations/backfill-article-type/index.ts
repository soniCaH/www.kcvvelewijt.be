/**
 * Backfills `articleType = "announcement"` on legacy articles (#1334).
 * Idempotent — articles that already carry a type are skipped.
 *
 * Logic + tests live in `@kcvv/sanity-studio/migrations`. This file is the
 * Sanity CLI entry point for the production studio.
 *
 * Dry-run (the CLI default):
 *   npx sanity@latest migration run backfill-article-type --project vhb33jaz --dataset production
 *
 * Apply:
 *   npx sanity@latest migration run backfill-article-type --project vhb33jaz --dataset production --no-dry-run
 */
import {backfillArticleTypeMigration} from '@kcvv/sanity-studio/migrations'

export default backfillArticleTypeMigration
