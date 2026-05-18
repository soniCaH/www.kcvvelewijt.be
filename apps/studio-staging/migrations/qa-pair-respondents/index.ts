/**
 * Staging counterpart to `apps/studio/migrations/qa-pair-respondents/`.
 * See `packages/sanity-studio/src/migrations/qa-pair-respondents.ts`
 * for the full contract — both studios share the same source.
 *
 * Run against staging first (4 seeded interview docs at PR time):
 *   npx sanity@latest migration run qa-pair-respondents --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run qa-pair-respondents --project vhb33jaz --dataset staging
 */
import {qaPairRespondentsMigration} from '@kcvv/sanity-studio/migrations'

export default qaPairRespondentsMigration
