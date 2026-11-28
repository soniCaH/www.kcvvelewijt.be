import { Effect, Either } from "effect";
import { readBffEnv } from "@/lib/env/server";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";

// Rendered per request and cached by the CDN through `s-maxage`, never
// prerendered: a prerendered route is served frozen at the deploy (#3495),
// and `force-dynamic` writes nothing to the ISR cache (#3812). This is a CDN
// header, not the in-process data cache that apps/web/CLAUDE.md forbids
// (`unstable_cache`). Why a day: docs/agents/api-ops.md (`matches:upcoming`).
// No stale-while-revalidate: a copy older than a day would list played matches.
export const dynamic = "force-dynamic";

const ONE_DAY = 86_400;

// The Studio runs in the browser on *.sanity.studio (and localhost). The list
// is public fixture data, read without credentials, so any origin may read it.
const CORS = { "Access-Control-Allow-Origin": "*" };

const failure = (status: number) =>
  Response.json(
    { error: "De wedstrijdlijst is nu niet beschikbaar." },
    { status, headers: { ...CORS, "Cache-Control": "no-store" } },
  );

/**
 * Every coming match of every visible team to the end of the season, for the
 * Studio's Matchbal picker (#3920). The BFF needs its secret key, so the
 * Studio cannot call it directly.
 */
export const GET = async () => {
  // Checked first: without it the BFF client cannot even be built.
  if (Either.isLeft(readBffEnv())) return failure(503);

  try {
    const result = await runPromise(
      Effect.flatMap(BffService, (bff) => bff.getUpcomingMatches()).pipe(
        Effect.either,
      ),
    );
    if (Either.isLeft(result)) {
      console.error("[Upcoming matches API] BFF error:", result.left);
      return failure(502);
    }
    return Response.json(result.right, {
      headers: { ...CORS, "Cache-Control": `public, s-maxage=${ONE_DAY}` },
    });
  } catch (error) {
    console.error("[Upcoming matches API] BFF error:", error);
    return failure(502);
  }
};
