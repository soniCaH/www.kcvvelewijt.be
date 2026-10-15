/**
 * #3489: the match-team index build (about 21 PSD calls) runs under a gate
 * flight, against the REAL KV + Durable Object gate. N concurrent readers on an
 * expired index used to rebuild it N times; now exactly one builds and the
 * rest wait, then read the leader's cached result.
 */
import { env } from "cloudflare:test";
import { afterEach, describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import { PsdService, PsdServiceLive } from "./service";
import { PsdGateLive } from "./gate";
import { KvCacheLive } from "../cache/kv-cache";
import { SanityProjection } from "../sanity/projection";
import type { SanityProjectionInterface } from "../sanity/projection";
import { makeTestEnvLayer } from "../test-helpers/env-layer";

const sanity: SanityProjectionInterface = {
  getPlayersImageState: () => Effect.succeed(new Map()),
  getStaffImageState: () => Effect.succeed(new Map()),
  getActivePlayerPsdIds: () => Effect.succeed([]),
  getActiveStaffPsdIds: () => Effect.succeed([]),
  getActiveTeamPsdIds: () => Effect.succeed([]),
  getTeamPlayerPsdIds: () => Effect.succeed([]),
  getVisibleTeamPsdIds: () => Effect.succeed(["1"]),
  getProtectedStaffPsdIds: () => Effect.succeed([]),
  getFormRoutingConfig: () => Effect.succeed(null),
};

const season = {
  id: 42,
  name: "2024-2025",
  start: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
};

const detail = {
  general: {
    id: 99,
    date: "2025-01-15 15:00",
    homeClub: { id: 123, name: "KCVV Elewijt" },
    awayClub: { id: 456, name: "Opponent FC" },
    goalsHomeTeam: 2,
    goalsAwayTeam: 0,
    competitionType: { id: 1, name: "3de Nationale", type: "LEAGUE" },
    viewGameReport: true,
    status: 0,
  },
};

describe("getMatchTeamIndex single flight (workerd)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("N concurrent callers on an expired index trigger exactly one build", async () => {
    // Seed everything but the index, so the only `/games/team/` traffic is the build.
    await env.PSD_CACHE.put("psd:teams-by-id", "{}");
    await env.PSD_CACHE.put("psd:current-season-id", JSON.stringify(season));
    await env.PSD_CACHE.put("psd:competition-labels", "{}");

    let builds = 0;
    const json = (body: unknown) => new Response(JSON.stringify(body));
    vi.stubGlobal("fetch", async (input: unknown) => {
      const url = String(input);
      if (url.includes("/games/team/")) {
        builds++;
        await new Promise((r) => setTimeout(r, 150)); // long enough for followers to pile up
        return json({ content: [] });
      }
      if (url.includes("/teams")) {
        return json([
          {
            id: 1,
            name: "KCVV Elewijt A",
            age: "A",
            gender: "mannen",
            footbelId: 123,
            active: true,
          },
        ]);
      }
      return json(detail);
    });

    const layer = PsdServiceLive.pipe(
      Layer.provideMerge(
        Layer.mergeAll(
          KvCacheLive,
          PsdGateLive,
          Layer.succeed(SanityProjection, sanity),
        ),
      ),
      Layer.provideMerge(
        makeTestEnvLayer({ PSD_CACHE: env.PSD_CACHE, PSD_GATE: env.PSD_GATE }),
      ),
    );

    const read = () =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* PsdService;
          return yield* service.getMatchDetail(99);
        }).pipe(Effect.provide(layer)),
      );

    const results = await Promise.all(Array.from({ length: 5 }, read));

    expect(results).toHaveLength(5);
    // One team in the index fixture, so one build = one games call.
    expect(builds).toBe(1);
  });
});
