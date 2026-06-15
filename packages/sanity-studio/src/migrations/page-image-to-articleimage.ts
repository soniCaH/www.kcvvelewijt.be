import {defineMigration} from 'sanity/migrate'
import {
  type ArticleWithImageBlocksDoc,
  migrateImageToArticleImage,
} from './image-to-articleimage'

/**
 * Phase 10 (#2122): converts legacy `image` body blocks → `articleImage`
 * on `page` documents (the generic CMS pages served at `/club/[slug]` via
 * `PageRepository`).
 *
 * The translation rule is identical to the Phase 5 article-body backfill
 * (#1850) — only the targeted document type differs — so this migration
 * reuses the tested `migrateImageToArticleImage` pure function and simply
 * retargets `documentTypes` to `['page']`. See
 * `./image-to-articleimage.ts` for the full shape-detection / patch
 * contract.
 *
 * MUST run before deploying the `club/[slug]/page.tsx` switch from
 * `<SanityArticleBody>` → `<ArticleBody>`: the new PT serializer only
 * registers `articleImage`, so any unmigrated plain `image` block silently
 * drops from the rendered body after the switch.
 *
 * Idempotent — blocks already `_type === 'articleImage'` are left alone, so
 * re-runs are safe.
 *
 * Run against staging first, then production after staging is verified:
 *   npx sanity@latest migration run page-image-to-articleimage --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run page-image-to-articleimage --project vhb33jaz --dataset staging --no-dry-run
 *   npx sanity@latest migration run page-image-to-articleimage --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run page-image-to-articleimage --project vhb33jaz --dataset production --no-dry-run
 */
export default defineMigration({
  title: 'Migrate legacy `image` body blocks → `articleImage` on page docs (#2122)',
  documentTypes: ['page'],

  migrate: {
    document(doc) {
      return migrateImageToArticleImage(doc as ArticleWithImageBlocksDoc)
    },
  },
})
