/**
 * Production counterpart to `apps/studio-staging/migrations/image-to-articleimage/`.
 * See `packages/sanity-studio/src/migrations/image-to-articleimage.ts`
 * for the full contract.
 *
 * Phase 5 article-body data backfill (#1850): converts every legacy
 * `image` body block (122 articles in production) to `articleImage`
 * with `width: 'prose'` default + asset ref / hotspot / crop / alt
 * preserved. Idempotent — re-runs are safe.
 *
 * MUST run before deploying the page.tsx switch (`<SanityArticleBody>`
 * → `<ArticleBody>`); the new PT serializer only registers
 * `articleImage`, so any unmigrated `image` block silently drops from
 * the rendered body after the switch.
 *
 * Run against production AFTER staging has been verified:
 *   npx sanity@latest migration run image-to-articleimage --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run image-to-articleimage --project vhb33jaz --dataset production --no-dry-run
 */
import {imageToArticleImageMigration} from '@kcvv/sanity-studio/migrations'

export default imageToArticleImageMigration
