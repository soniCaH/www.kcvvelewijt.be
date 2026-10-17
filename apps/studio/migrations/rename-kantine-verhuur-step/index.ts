/**
 * Production counterpart to `apps/studio-staging/migrations/rename-kantine-verhuur-step/`.
 * See `packages/sanity-studio/src/migrations/rename-kantine-verhuur-step.ts`
 * for the full contract.
 *
 * #3525: renames "Kantine & Evenementen" to "Kantineverhuur" in the step text of the "Terrein of kantine huren" question.
 * Idempotent — re-runs are safe.
 *
 * Run against production AFTER staging has been verified:
 *   npx sanity@latest migration run rename-kantine-verhuur-step --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run rename-kantine-verhuur-step --project vhb33jaz --dataset production --no-dry-run --no-confirm
 */
import {renameKantineVerhuurStepMigration} from '@kcvv/sanity-studio/migrations'

export default renameKantineVerhuurStepMigration
