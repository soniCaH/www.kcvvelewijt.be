/**
 * Converts `article.title` from a string to single-block Portable Text.
 * Idempotent — a title that is already an array is skipped.
 *
 * Logic + tests live in `@kcvv/sanity-studio/migrations`. This file is the
 * Sanity CLI entry point for the production studio.
 *
 * Dry-run (the CLI default):
 *   npx sanity@latest migration run title-to-portable-text --project vhb33jaz --dataset production
 *
 * Apply:
 *   npx sanity@latest migration run title-to-portable-text --project vhb33jaz --dataset production --no-dry-run
 */
import {titleToPortableTextMigration} from '@kcvv/sanity-studio/migrations'

export default titleToPortableTextMigration
