/**
 * Default Open Graph Image
 *
 * Fallback card for pages that don't define their own. Same sheet as every
 * other share card — see `@/lib/og/share-card` — so a link to the homepage and
 * a link to a player page arrive looking like the same club.
 */

import { OG_CONTENT_TYPE, OG_SIZE, renderShareCard } from "@/lib/og/share-card";

export const runtime = "nodejs";

export const size = OG_SIZE;

export const contentType = OG_CONTENT_TYPE;

/**
 * Generate the site-wide fallback Open Graph PNG.
 *
 * @returns A 1200×630 PNG carrying the club crest and wordmark
 */
const Image = () => {
  return renderShareCard({ nameTop: "KCVV", nameBottom: "Elewijt" });
};

export default Image;
