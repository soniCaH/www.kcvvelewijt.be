/**
 * Production counterpart to
 * `apps/studio-staging/migrations/repoint-legacy-player-links/`.
 * See `packages/sanity-studio/src/migrations/repoint-legacy-player-links.ts`
 * for the full contract.
 *
 * Repoints every stored `/player/<slug>` link in a published `article` or
 * `page` to a relative `/spelers/<psdId>` where the player still resolves,
 * or strips the anchor (keeping the text) where it doesn't. Measured on
 * production 2026-09-10 (#2482): 59 link instances across exactly 3
 * articles. Idempotent — re-running finds nothing left to patch.
 *
 * Run against production AFTER staging has been verified:
 *   npx sanity@latest migration run repoint-legacy-player-links --project vhb33jaz --dataset production --dry-run
 *   npx sanity@latest migration run repoint-legacy-player-links --project vhb33jaz --dataset production --no-dry-run
 */
import {repointLegacyPlayerLinksMigration} from '@kcvv/sanity-studio/migrations'

export default repointLegacyPlayerLinksMigration
