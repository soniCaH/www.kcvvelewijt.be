/**
 * Staging counterpart to `apps/studio/migrations/drop-player-unused-fields/`.
 * See `packages/sanity-studio/src/migrations/drop-player-unused-fields.ts`
 * for the full contract — both studios share the same source.
 *
 * Phase 6.A tracer (#1881): unsets `nationality`, `height`, and `weight`
 * on player documents — these three fields are dropped from the schema.
 * Idempotent — re-runs are safe.
 *
 * Run against staging first:
 *   npx sanity@latest migration run drop-player-unused-fields --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run drop-player-unused-fields --project vhb33jaz --dataset staging
 */
import {dropPlayerUnusedFieldsMigration} from '@kcvv/sanity-studio/migrations'

export default dropPlayerUnusedFieldsMigration
