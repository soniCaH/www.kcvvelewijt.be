/**
 * Production counterpart to
 * `apps/studio-staging/migrations/drop-responsibility-team-role-fallback/`.
 * See `packages/sanity-studio/src/migrations/drop-responsibility-team-role-fallback.ts`
 * for the full contract.
 *
 * #2952: unsets `teamRoleFallback` on `responsibility` documents — the field
 * is dropped from the schema (unreachable by construction; 2 production
 * docs carry it).
 *
 * Run against production AFTER staging has been verified:
 *   npx sanity@latest migration run drop-responsibility-team-role-fallback --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run drop-responsibility-team-role-fallback --project vhb33jaz --dataset production --no-dry-run --no-confirm
 */
import {dropResponsibilityTeamRoleFallbackMigration} from '@kcvv/sanity-studio/migrations'

export default dropResponsibilityTeamRoleFallbackMigration
