/**
 * Staging counterpart to
 * `apps/studio/migrations/drop-responsibility-team-role-fallback/`.
 *
 * See that file for the full contract — both migrations share the same
 * source in `@kcvv/sanity-studio/migrations`.
 *
 * Run against staging first:
 *   npx sanity@latest migration run drop-responsibility-team-role-fallback --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run drop-responsibility-team-role-fallback --project vhb33jaz --dataset staging --no-dry-run --no-confirm
 */
import {dropResponsibilityTeamRoleFallbackMigration} from '@kcvv/sanity-studio/migrations'

export default dropResponsibilityTeamRoleFallbackMigration
