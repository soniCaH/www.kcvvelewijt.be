import { unstable_cache } from "next/cache";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { ShortLinkRepository } from "@/lib/repositories/short-link.repository";
import { SANITY_LIST_REVALIDATE, SANITY_TAGS } from "@/lib/sanity/cache-tags";

/**
 * Every short link (#3573), read from Sanity once per cache fill, never per
 * request: the top-level catch-all calls this for any one-segment path no real
 * route owns, bots on random paths included.
 *
 * No time limit of its own. The Sanity webhook busts `SANITY_TAGS.shortLinks`
 * on a `shortLink` change (`/api/revalidate`); the daily revalidate is only
 * the net under a missed delivery.
 *
 * Subject read: with no list the catch-all cannot tell a short link from a
 * typo, so a Sanity failure is a 500 (and uncached: `unstable_cache` stores no
 * throw). Answering 404 would tell a flyer's QR code the link is gone.
 */
export const getShortLinks = unstable_cache(
  async () =>
    runPromise(
      Effect.gen(function* () {
        const repo = yield* ShortLinkRepository;
        return yield* repo.findAll();
      }).pipe(Effect.orDie), // subject read, see above
    ),
  ["short-links"],
  { revalidate: SANITY_LIST_REVALIDATE, tags: [SANITY_TAGS.shortLinks] },
);

/**
 * The short link for a path segment, or `null`. Case-insensitive, as the
 * `redirects()` entries it replaces were (`/Stage` on a printed flyer works):
 * names are stored lowercase.
 */
export async function findShortLink(segment: string) {
  const name = segment.toLowerCase();
  return (await getShortLinks()).find((link) => link.name === name) ?? null;
}
