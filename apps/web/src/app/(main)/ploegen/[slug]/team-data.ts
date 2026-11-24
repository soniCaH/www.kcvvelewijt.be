import { cache } from "react";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { SANITY_TAGS } from "@/lib/sanity/cache-tags";

/**
 * Subject read shared by both children of this segment —
 * `(detail)/page.tsx` (`/ploegen/[slug]`) and `wedstrijden/page.tsx`
 * (`/ploegen/[slug]/wedstrijden`) — plus their respective `generateMetadata`
 * exports and this segment's own `layout.tsx` (existence check, #2968). A
 * failed read takes the page down with it via `Effect.orDie` (#2864).
 *
 * Wrapped in React `cache()` so every caller in one request's render pass
 * shares a single `findBySlug` — `@effect/platform` always attaches an
 * `AbortSignal`, which opts the request out of Next's own `fetch`
 * memoization (same pattern as `/wedstrijd/[matchId]`'s
 * `fetchMatchOrNotFound`, #2441). Only one of the two child segments ever
 * renders per request, so in practice this dedupes layout + generateMetadata
 * + page down to one read, not three.
 */
export const fetchTeamOrNull = cache(async function fetchTeamOrNull(
  slug: string,
) {
  return runPromise(
    Effect.gen(function* () {
      const repo = yield* TeamRepository;
      // Tagged `sponsors` only (#3652): the read carries the Sponsors that name
      // this Team, so a Sponsor publish refreshes it. Not `teams`: a team
      // publish must not rebuild every `/ploegen/<slug>` (#3483).
      return yield* repo.findBySlug(slug, { tags: [SANITY_TAGS.sponsors] });
    }).pipe(Effect.orDie),
  );
});
