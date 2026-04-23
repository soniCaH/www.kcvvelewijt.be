/**
 * Wraps the pre-existing `article.subject` object into `article.subjects[]`
 * for multi-subject interview support (#1358). Idempotent: already-migrated
 * docs are skipped; dangling legacy `subject` fields are cleaned up.
 *
 * Logic + tests live in `@kcvv/sanity-studio` so the migration can be
 * unit-tested against synthetic documents. This file is the Sanity CLI
 * entry point.
 *
 * Dry-run first:
 *   npx sanity@latest migration run interview-subject-to-subjects --project vhb33jaz --dataset staging --dry-run
 *
 * Apply:
 *   npx sanity@latest migration run interview-subject-to-subjects --project vhb33jaz --dataset staging
 *   npx sanity@latest migration run interview-subject-to-subjects --project vhb33jaz --dataset production
 */
import {interviewSubjectToSubjectsMigration} from '@kcvv/sanity-studio'

export default interviewSubjectToSubjectsMigration
