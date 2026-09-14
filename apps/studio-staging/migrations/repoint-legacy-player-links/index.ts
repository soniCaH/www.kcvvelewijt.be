/**
 * Staging counterpart to
 * `apps/studio/migrations/repoint-legacy-player-links/`.
 * See `packages/sanity-studio/src/migrations/repoint-legacy-player-links.ts`
 * for the full contract — both studios share the same source.
 *
 * Repoints every stored `/player/<slug>` link in a published `article` or
 * `page` to a relative `/spelers/<psdId>` where the player still resolves,
 * or strips the anchor (keeping the text) where it doesn't. Run against
 * staging first, verify, then run production (see the sibling facade):
 *   npx sanity@latest migration run repoint-legacy-player-links --project vhb33jaz --dataset staging --dry-run
 *   npx sanity@latest migration run repoint-legacy-player-links --project vhb33jaz --dataset staging --no-dry-run
 */
import {repointLegacyPlayerLinksMigration} from '@kcvv/sanity-studio/migrations'

export default repointLegacyPlayerLinksMigration
