/**
 * Staging counterpart to `apps/studio/migrations/page-image-to-articleimage/`.
 * See `packages/sanity-studio/src/migrations/page-image-to-articleimage.ts`
 * for the full contract — both studios share the same source.
 *
 * Phase 10 (#2122): converts every legacy `image` body block on `page`
 * documents (the `/club/[slug]` CMS pages) to `articleImage` with a
 * `width: 'prose'` default. Idempotent — re-runs are safe.
 *
 * Run against staging first:
 *   npx sanity@latest migration run page-image-to-articleimage --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run page-image-to-articleimage --project vhb33jaz --dataset staging --no-dry-run
 */
import {pageImageToArticleImageMigration} from '@kcvv/sanity-studio/migrations'

export default pageImageToArticleImageMigration
