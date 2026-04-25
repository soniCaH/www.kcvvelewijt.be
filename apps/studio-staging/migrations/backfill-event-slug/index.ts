/**
 * Backfills `event.slug` from `title` for documents that have no slug yet
 * (Phase 3 of the related-content extension, #1318). Idempotent — events
 * that already carry a non-empty `slug.current` are skipped. Per-run
 * dedupe keeps two events sharing a title from colliding.
 *
 * Logic + tests live in `@kcvv/sanity-studio/migrations` so the migration
 * can be unit-tested against synthetic documents. This file is the Sanity
 * CLI entry point for the staging studio.
 *
 * Dry-run first:
 *   npx sanity@latest migration run backfill-event-slug --project vhb33jaz --dataset staging --dry-run
 *
 * Apply:
 *   npx sanity@latest migration run backfill-event-slug --project vhb33jaz --dataset staging
 *   npx sanity@latest migration run backfill-event-slug --project vhb33jaz --dataset production
 */
import {backfillEventSlugMigration} from '@kcvv/sanity-studio/migrations'

export default backfillEventSlugMigration
