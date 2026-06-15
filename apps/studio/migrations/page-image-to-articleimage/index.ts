/**
 * Production counterpart to `apps/studio-staging/migrations/page-image-to-articleimage/`.
 * See `packages/sanity-studio/src/migrations/page-image-to-articleimage.ts`
 * for the full contract.
 *
 * Phase 10 (#2122): converts every legacy `image` body block on `page`
 * documents (the `/club/[slug]` CMS pages) to `articleImage` with a
 * `width: 'prose'` default. Reuses the Phase 5 (#1850) transform, retargeted
 * to `documentTypes: ['page']`. Idempotent — re-runs are safe.
 *
 * MUST run before deploying the page.tsx switch (`<SanityArticleBody>` →
 * `<ArticleBody>`); the new PT serializer only registers `articleImage`, so
 * any unmigrated `image` block silently drops from the rendered body after
 * the switch.
 *
 * Run against production AFTER staging has been verified:
 *   npx sanity@latest migration run page-image-to-articleimage --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run page-image-to-articleimage --project vhb33jaz --dataset production --no-dry-run
 */
import {pageImageToArticleImageMigration} from '@kcvv/sanity-studio/migrations'

export default pageImageToArticleImageMigration
