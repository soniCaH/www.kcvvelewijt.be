/**
 * ⛔ ROLLBACK ONLY — never run as a sync. REVERSE of `title-to-portable-text`:
 * flattens every Portable Text article title back to a plain string. Its
 * production patch count proves production is in the correct forward state,
 * not that it is unrun.
 *
 * Logic + tests live in `@kcvv/sanity-studio/migrations`. This file is the
 * Sanity CLI entry point for the staging studio.
 *
 * Only for an intermediate-state rollback (dataset ahead of deployed code):
 *   npx sanity@latest migration run title-portable-text-to-string --project vhb33jaz --dataset staging
 */
import {titlePortableTextToStringMigration} from '@kcvv/sanity-studio/migrations'

export default titlePortableTextToStringMigration
