/**
 * Production counterpart to `apps/studio-staging/migrations/backfill-organigram-pillar/`.
 * See `packages/sanity-studio/src/migrations/backfill-organigram-pillar.ts`
 * for the full contract.
 *
 * #3525: sets `pillar` on organigramNode documents from their role code and seeds the why-line on the 8 key boxes. Only fills gaps.
 * Idempotent — re-runs are safe.
 *
 * Run against production AFTER staging has been verified:
 *   npx sanity@latest migration run backfill-organigram-pillar --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run backfill-organigram-pillar --project vhb33jaz --dataset production --no-dry-run --no-confirm
 */
import {backfillOrganigramPillarMigration} from '@kcvv/sanity-studio/migrations'

export default backfillOrganigramPillarMigration
