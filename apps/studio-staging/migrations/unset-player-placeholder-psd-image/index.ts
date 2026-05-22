/**
 * Staging counterpart to
 * `apps/studio/migrations/unset-player-placeholder-psd-image/`.
 * See `packages/sanity-studio/src/migrations/unset-player-placeholder-psd-image.ts`
 * for the full contract.
 *
 * Issue #1895: unsets `psdImage` (and the sibling `psdImageUrl`) on
 * every player document whose `psdImage.asset._ref` matches PSD's
 * "no image available" placeholder asset. Idempotent — re-runs are safe.
 *
 * Run against staging FIRST:
 *   npx sanity@latest migration run unset-player-placeholder-psd-image --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run unset-player-placeholder-psd-image --project vhb33jaz --dataset staging
 */
import {unsetPlayerPlaceholderPsdImageMigration} from '@kcvv/sanity-studio/migrations'

export default unsetPlayerPlaceholderPsdImageMigration
