/**
 * Production counterpart to `apps/studio-staging/migrations/articleimage-videoblock-width/`.
 * See `packages/sanity-studio/src/migrations/articleimage-videoblock-width.ts`
 * for the full contract.
 *
 * Phase 5 article-body width migration (#1843): translates the legacy
 * `articleImage.fullBleed` / `videoBlock.fullBleed` booleans into the new
 * `width: 'prose' | 'wide' | 'bleed'` enum and unsets the legacy field.
 * Idempotent — re-runs are safe.
 *
 * Production usage of `fullBleed` is light (single-digit articles at PR
 * time, exact count not enumerated), so the patch volume on a real run
 * should stay small. Dry-run first and verify the patch list before
 * applying.
 *
 * Run against production AFTER staging has been verified:
 *   npx sanity@latest migration run articleimage-videoblock-width --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run articleimage-videoblock-width --project vhb33jaz --dataset production
 */
import {articleImageVideoBlockWidthMigration} from '@kcvv/sanity-studio/migrations'

export default articleImageVideoBlockWidthMigration
