/**
 * #3467: the kickoff stampede, against the REAL KV + Durable Object gate.
 *
 * Right after a listed kickoff the `matches:next` key is stale and every
 * concurrent reader used to take a blocking refresh — N foreground PSD
 * fan-outs queued behind the 5/s gate. Now a stale read is served at once
 * (minus the kicked-off match) and exactly one single-flight background
 * refresh runs.
 */
import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import { MatchesArray, type Match } from "@kcvv/api-contract";
import { CACHE_VERSION, getNextMatchesHandler } from "./matches";
import { KvCacheLive } from "../cache/kv-cache";
import { PsdGateLive } from "../psd/gate";
import { PsdService, type PsdServiceInterface } from "../psd/service";
import { BackgroundRunnerService } from "../psd/background";
import { makeTestEnvLayer } from "../test-helpers/env-layer";

const HOUR = 60 * 60 * 1000;

const match = (id: number, offsetMs: number): Match => ({
  id,
  date: new Date(Date.now() + offsetMs),
  time: "15:00",
  home_team: { id: 123, name: "KCVV Elewijt" },
  away_team: { id: 456, name: "Opponent FC" },
  status: "scheduled",
  competition: "LEAGUE",
});

describe("getNextMatchesHandler — stale read after a kickoff (workerd)", () => {
  it("50 concurrent stale reads: 0 blocking fan-outs, exactly 1 background refresh", async () => {
    const key = `matches:next:${CACHE_VERSION}`;
    await env.PSD_CACHE.put(
      key,
      JSON.stringify({
        value: S.encodeSync(MatchesArray)([match(1, -HOUR), match(2, HOUR)]),
        fetchedAt: Date.now() - 2 * HOUR, // stale: past the 15 min matchday TTL
      }),
    );

    let fanOuts = 0;
    let readsDone = false;
    let fanOutsStartedBeforeReadsDone = 0;
    const service = {
      getNextMatches: () =>
        Effect.gen(function* () {
          fanOuts++;
          if (!readsDone) fanOutsStartedBeforeReadsDone++;
          yield* Effect.sleep("50 millis");
          return [match(2, HOUR)];
        }),
    } as unknown as PsdServiceInterface;

    const baseLayer = Layer.mergeAll(
      Layer.succeed(PsdService, service),
      KvCacheLive,
      PsdGateLive,
    ).pipe(
      Layer.provideMerge(
        makeTestEnvLayer({ PSD_CACHE: env.PSD_CACHE, PSD_GATE: env.PSD_GATE }),
      ),
    );

    const detached: Promise<void>[] = [];
    const runner = Layer.succeed(BackgroundRunnerService, {
      fork: (_label, effect) =>
        Effect.sync(() => {
          detached.push(
            Effect.runPromise(
              Effect.provide(
                effect,
                baseLayer,
              ) as unknown as Effect.Effect<void>,
            ),
          );
        }),
    });

    const read = () =>
      Effect.runPromise(
        getNextMatchesHandler().pipe(
          Effect.provide(runner),
          Effect.provide(baseLayer),
        ),
      );

    const results = await Promise.all(Array.from({ length: 50 }, read));
    readsDone = true;

    // Every reader is served at once, without the kicked-off match.
    for (const r of results) expect(r.map((m) => m.id)).toEqual([2]);
    // No fan-out started while the readers were still being served.
    expect(fanOutsStartedBeforeReadsDone).toBe(0);

    await Promise.all(detached);
    expect(fanOuts).toBe(1);
  });
});
