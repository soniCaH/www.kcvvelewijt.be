import { Either } from "effect";
import { readBffEnv } from "@/lib/env/server";
import { bffKeyHeader } from "@/lib/server/bff-key";

// Rendered per request and cached by the CDN through `s-maxage`, never
// prerendered: a prerendered route is served frozen at the deploy (#3495),
// and `force-dynamic` writes nothing to the ISR cache (#3812). This is a CDN
// header, not the in-process data cache that apps/web/CLAUDE.md forbids
// (`unstable_cache`); Kevin asked for at least a day here (#3920).
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
 * Studio cannot call it directly. Kevin, 2026-11-28: cache it at least a day.
 */
export const GET = async () => {
  const env = readBffEnv();
  if (Either.isLeft(env)) return failure(503);

  const { KCVV_API_URL: bffUrl, BFF_SHARED_SECRET: secret } = env.right;
  try {
    const res = await fetch(`${bffUrl}/matches/upcoming`, {
      headers: bffKeyHeader(secret),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return failure(502);
    return new Response(await res.text(), {
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        "Cache-Control": `public, s-maxage=${ONE_DAY}`,
      },
    });
  } catch (error) {
    console.error("[Upcoming matches API] BFF error:", error);
    return failure(502);
  }
};
