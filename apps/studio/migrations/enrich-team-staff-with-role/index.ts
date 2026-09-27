/**
 * Converts `team.staff` plain references into `{member, role}` objects
 * (#1225). Idempotent — migrated entries are kept as they are.
 *
 * Logic + tests live in `@kcvv/sanity-studio/migrations`. This file is the
 * Sanity CLI entry point for the production studio.
 *
 * Dry-run (the CLI default):
 *   npx sanity@latest migration run enrich-team-staff-with-role --project vhb33jaz --dataset production
 *
 * Apply:
 *   npx sanity@latest migration run enrich-team-staff-with-role --project vhb33jaz --dataset production --no-dry-run
 */
import {enrichTeamStaffWithRoleMigration} from '@kcvv/sanity-studio/migrations'

export default enrichTeamStaffWithRoleMigration
