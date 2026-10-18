/**
 * Staging counterpart to `apps/studio/migrations/rename-kantine-verhuur-step/`.
 *
 * See that file for the full contract — both migrations share the same
 * source in `@kcvv/sanity-studio/migrations`.
 *
 * Run against staging first:
 *   npx sanity@latest migration run rename-kantine-verhuur-step --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run rename-kantine-verhuur-step --project vhb33jaz --dataset staging --no-dry-run --no-confirm
 */
import {renameKantineVerhuurStepMigration} from '@kcvv/sanity-studio/migrations'

export default renameKantineVerhuurStepMigration
