/**
 * Sets `homePage.youthPlayerCount`/`youthTeamCount` on the `homePage`
 * singleton, seeding each missing field with the exact value the retired
 * "220+ spelers · 16 ploegen" literal used to render (#2401 item 4 / review
 * finding 3). Idempotent per field — a field an editor has already set is
 * left alone; re-running after both are set produces zero patches.
 *
 * Logic + tests live in `@kcvv/sanity-studio/migrations` so the migration
 * can be unit-tested against synthetic documents. This file is the Sanity
 * CLI entry point for the production studio.
 *
 * Dry-run first (this IS the CLI default — the flag is explicit for clarity):
 *   npx sanity@latest migration run set-homepage-youth-stats --project vhb33jaz --dataset staging --dry-run
 *
 * Apply, staging BEFORE production (see the tracking issue linked from PR #2925):
 *   npx sanity@latest migration run set-homepage-youth-stats --project vhb33jaz --dataset staging --no-dry-run
 *   npx sanity@latest migration run set-homepage-youth-stats --project vhb33jaz --dataset production --no-dry-run
 */
import {setHomepageYouthStatsMigration} from '@kcvv/sanity-studio/migrations'

export default setHomepageYouthStatsMigration
