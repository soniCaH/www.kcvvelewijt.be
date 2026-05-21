/**
 * Production counterpart to `apps/studio-staging/migrations/drop-player-unused-fields/`.
 * See `packages/sanity-studio/src/migrations/drop-player-unused-fields.ts`
 * for the full contract.
 *
 * Phase 6.A tracer (#1881): unsets `nationality`, `height`, and `weight`
 * on player documents — these three fields are dropped from the schema.
 * Idempotent — re-runs are safe.
 *
 * Run against production AFTER staging has been verified:
 *   npx sanity@latest migration run drop-player-unused-fields --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run drop-player-unused-fields --project vhb33jaz --dataset production
 */
import {dropPlayerUnusedFieldsMigration} from '@kcvv/sanity-studio/migrations'

export default dropPlayerUnusedFieldsMigration
