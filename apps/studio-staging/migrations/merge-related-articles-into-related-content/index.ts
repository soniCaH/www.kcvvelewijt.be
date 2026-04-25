/**
 * Staging counterpart to `apps/studio/migrations/merge-related-articles-into-related-content/`.
 *
 * See that file for the full contract — both migrations share the same
 * source in `@kcvv/sanity-studio/migrations`.
 *
 * Dry-run first:
 *   npx sanity@latest migration run merge-related-articles-into-related-content --project vhb33jaz --dataset staging --dry-run
 *
 * Apply:
 *   npx sanity@latest migration run merge-related-articles-into-related-content --project vhb33jaz --dataset staging
 *   npx sanity@latest migration run merge-related-articles-into-related-content --project vhb33jaz --dataset production
 */
import {mergeRelatedArticlesIntoRelatedContentMigration} from '@kcvv/sanity-studio/migrations'

export default mergeRelatedArticlesIntoRelatedContentMigration
