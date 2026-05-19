/**
 * Staging counterpart to `apps/studio/migrations/articleimage-videoblock-width/`.
 * See `packages/sanity-studio/src/migrations/articleimage-videoblock-width.ts`
 * for the full contract — both studios share the same source.
 *
 * Phase 5 article-body width migration (#1843): translates the legacy
 * `articleImage.fullBleed` / `videoBlock.fullBleed` booleans into the new
 * `width: 'prose' | 'wide' | 'bleed'` enum and unsets the legacy field.
 * Idempotent — re-runs are safe.
 *
 * Run against staging first:
 *   npx sanity@latest migration run articleimage-videoblock-width --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run articleimage-videoblock-width --project vhb33jaz --dataset staging
 */
import {articleImageVideoBlockWidthMigration} from '@kcvv/sanity-studio/migrations'

export default articleImageVideoBlockWidthMigration
