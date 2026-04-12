import { cache } from "react";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { mapMatchesToUpcomingMatches } from "@/lib/mappers";
import type { UpcomingMatch } from "@/components/match/types";

/**
 * Fetch the most relevant first-team match (last result or next fixture).
 * Returns `null` when no data is available or the BFF call fails.
 *
 * Wrapped in React `cache()` for request-level deduplication — multiple
 * Server Components calling this in the same render share a single BFF call.
 */
export const getFirstTeamNextMatch = cache(
  async function getFirstTeamNextMatch(): Promise<UpcomingMatch | null> {
    try {
      const matches = await runPromise(
        Effect.gen(function* () {
          const bff = yield* BffService;
          return yield* bff.getNextMatches();
        }),
      );
      const upcoming = mapMatchesToUpcomingMatches(matches);
      return upcoming[0] ?? null;
    } catch {
      return null;
    }
  },
);
