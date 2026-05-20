/**
 * Staging counterpart to `apps/studio/migrations/image-to-articleimage/`.
 * See `packages/sanity-studio/src/migrations/image-to-articleimage.ts`
 * for the full contract — both studios share the same source.
 *
 * Phase 5 article-body data backfill (#1850): converts every legacy
 * `image` body block to `articleImage` with `width: 'prose'` default.
 * Idempotent — re-runs are safe.
 *
 * Run against staging first:
 *   npx sanity@latest migration run image-to-articleimage --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run image-to-articleimage --project vhb33jaz --dataset staging --no-dry-run
 */
import {imageToArticleImageMigration} from '@kcvv/sanity-studio/migrations'

export default imageToArticleImageMigration
