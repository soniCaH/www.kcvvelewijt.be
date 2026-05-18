/**
 * Production counterpart to `apps/studio-staging/migrations/qa-pair-respondents/`.
 * See `packages/sanity-studio/src/migrations/qa-pair-respondents.ts` for
 * the full contract.
 *
 * **0 production interviews at #1795 merge time** — running this against
 * production is a no-op until interviews ship in production. The script
 * is idempotent + safe to re-run.
 *
 * Run against production AFTER staging has been verified:
 *   npx sanity@latest migration run qa-pair-respondents --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run qa-pair-respondents --project vhb33jaz --dataset production
 */
import {qaPairRespondentsMigration} from '@kcvv/sanity-studio/migrations'

export default qaPairRespondentsMigration
