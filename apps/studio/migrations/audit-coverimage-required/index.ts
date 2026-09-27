/**
 * AUDIT-ONLY — logs every article missing `coverImage`. Mutates nothing,
 * so a dry run prints the same list as a real run.
 *
 * Logic + tests live in `@kcvv/sanity-studio/migrations`. This file is the
 * Sanity CLI entry point for the production studio.
 *
 * Dry-run (the CLI default):
 *   npx sanity@latest migration run audit-coverimage-required --project vhb33jaz --dataset production
 */
import {auditCoverImageRequiredMigration} from '@kcvv/sanity-studio/migrations'

export default auditCoverImageRequiredMigration
