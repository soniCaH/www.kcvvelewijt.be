import { afterEach, describe, it, expect, vi } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import { getRankingHandler } from "./ranking";
import { PsdService, type PsdServiceInterface } from "../psd/service";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { noopDurableKv } from "../test-helpers/kv-cache-mock";
import { testEnvLayer } from "../test-helpers/env-layer";
import { PsdGateTest } from "../psd/gate";
import { BackgroundRunnerService } from "../psd/background";
import { RankingTableArray, type RankingTable } from "@kcvv/api-contract";
import { ResourceNotFoundError, UpstreamUnavailableError } from "../psd/errors";

const rankingTables: readonly RankingTable[] = [
  {
    competition_id: 222464,
    competition_name: "3de Afdeling Voetb Vl A",
    entries: [
      {
        position: 1,
        team_id: 101,
        team_name: "KCVV Elewijt",
        team_logo: "https://cdn.example.com/extra_groot/123.png",
        played: 20,
        won: 15,
        drawn: 3,
        lost: 2,
        goals_for: 45,
        goals_against: 20,
        goal_difference: 25,
        points: 48,
        form: undefined,
      },
    ],
  },
];

function makeServiceMock(
  overrides: Partial<PsdServiceInterface> = {},
): PsdServiceInterface {
  return {
    getTeamMatches: () => Effect.fail(new Error("not needed") as never),
    getNextMatches: () => Effect.fail(new Error("not needed") as never),
    getMatchesWindow: () => Effect.fail(new Error("not needed") as never),
    getMatchDetail: () => Effect.fail(new Error("not needed") as never),
    getRanking: () => Effect.succeed(rankingTables),
    getOpponentHistory: () => Effect.die("not needed"),
    getPlayerStats: () => Effect.die("not needed"),
    getCurrentSeasonId: () => Effect.succeed(123),
    ...overrides,
  };
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  delete: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
  durable: noopDurableKv,
};

/** Map-backed KV, so a second read can hit what the first one stored. */
function makeMemoryCache(store = new Map<string, string>()): KvCacheInterface {
  return {
    get: (key) => Effect.succeed(store.get(key) ?? null),
    set: (key, value) => Effect.sync(() => void store.set(key, value)),
    delete: (key) => Effect.sync(() => void store.delete(key)),
    increment: () => Effect.succeed(undefined),
    durable: noopDurableKv,
  };
}

describe("getRankingHandler", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("yields PsdService and returns every ranking table", async () => {
    const result = await Effect.runPromise(
      getRankingHandler(1).pipe(
        Effect.provide(Layer.succeed(PsdService, makeServiceMock())),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
        Effect.provide(PsdGateTest),
        Effect.provide(testEnvLayer),
      ),
    );
    expect(result[0]?.competition_id).toBe(222464);
    expect(result[0]?.competition_name).toBe("3de Afdeling Voetb Vl A");
    expect(result[0]?.entries[0]?.position).toBe(1);
    expect(result[0]?.entries[0]?.team_name).toBe("KCVV Elewijt");
    expect(result[0]?.entries[0]?.points).toBe(48);
    expect(() => S.decodeUnknownSync(RankingTableArray)(result)).not.toThrow();
  });

  it("fails with ResourceNotFoundError when the team publishes no table", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        getRankingHandler(1).pipe(
          Effect.provide(
            Layer.succeed(
              PsdService,
              makeServiceMock({
                getRanking: () => Effect.succeed([]),
              }),
            ),
          ),
          Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
          Effect.provide(PsdGateTest),
          Effect.provide(testEnvLayer),
        ),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });

  // #3059 — a team with no table (onderbouw/middenbouw, U19) used to reach
  // PSD on every read, because "no table" was raised inside the cache and
  // never stored. Once PSD's daily quota ran out those reads turned into
  // 503s and took 11 team pages down, while every team WITH a table kept
  // serving its cached copy.
  it.each([
    [
      "an empty table list",
      () => Effect.succeed([] as readonly RankingTable[]),
    ],
    [
      "a PSD 404",
      () =>
        Effect.fail(
          new ResourceNotFoundError({
            message: "HTTP 404: Not Found",
            resourceType: "psd-resource",
            resourceId: "/teams/1/ranking",
          }),
        ),
    ],
  ])(
    "caches %s, so the next read of a team with no table never reaches PSD",
    async (_label, getRanking) => {
      let psdCalls = 0;
      const service = makeServiceMock({
        getRanking: () => {
          psdCalls++;
          return getRanking();
        },
      });
      const [first, second] = await Effect.runPromise(
        Effect.gen(function* () {
          const cache = makeMemoryCache();
          const run = Effect.either(
            getRankingHandler(1).pipe(
              Effect.provide(Layer.succeed(PsdService, service)),
              Effect.provide(Layer.succeed(KvCacheService, cache)),
              Effect.provide(PsdGateTest),
              Effect.provide(testEnvLayer),
            ),
          );
          return [yield* run, yield* run] as const;
        }),
      );

      expect(psdCalls).toBe(1);
      // The wire contract does not move: both reads still answer 404.
      for (const result of [first, second]) {
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left._tag).toBe("ResourceNotFound");
        }
      }
    },
  );

  // #3059 review — the "no table" answer must never cost a team the table it
  // already has. A refresh that briefly answers empty (a PSD glitch, or every
  // row failing to decode) runs in the background, keeps the cached table,
  // and never writes the no-table note.
  it("keeps a cached table when a background refresh answers empty", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const store = new Map<string, string>();
    let answer: readonly RankingTable[] = rankingTables;
    const layers = Layer.mergeAll(
      Layer.succeed(
        PsdService,
        makeServiceMock({ getRanking: () => Effect.succeed(answer) }),
      ),
      Layer.succeed(KvCacheService, makeMemoryCache(store)),
      PsdGateTest,
      testEnvLayer,
    );
    const pending: Promise<unknown>[] = [];
    const runner = Layer.succeed(BackgroundRunnerService, {
      fork: (_label, effect) =>
        Effect.sync(() => {
          // The refresh only needs what `layers` provides; the fork's
          // declared env is wider (same cast as kv-cache.test.ts).
          pending.push(
            Effect.runPromise(
              Effect.provide(effect, layers) as unknown as Effect.Effect<void>,
            ),
          );
        }),
    });
    const read = () =>
      Effect.runPromise(
        Effect.either(
          getRankingHandler(1).pipe(
            Effect.provide(layers),
            Effect.provide(runner),
          ),
        ),
      );

    expect((await read())._tag).toBe("Right");
    answer = [];
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000); // past TTL.RANKING
    const stale = await read();
    expect(pending).toHaveLength(1); // the refresh really ran
    await Promise.all(pending);
    const after = await read();

    for (const result of [stale, after]) {
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right[0]?.competition_id).toBe(222464);
      }
    }
    expect(store.has("ranking:none:team:1")).toBe(false);
  });

  // Without a background runner a stale read refreshes inline, and its 404
  // reaches the handler even though the table is still cached. The note must
  // not hide that table.
  it("never writes the no-table note while a table is cached", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const store = new Map<string, string>();
    let answer: readonly RankingTable[] = rankingTables;
    const read = () =>
      Effect.runPromise(
        Effect.either(
          getRankingHandler(1).pipe(
            Effect.provide(
              Layer.succeed(
                PsdService,
                makeServiceMock({ getRanking: () => Effect.succeed(answer) }),
              ),
            ),
            Effect.provide(
              Layer.succeed(KvCacheService, makeMemoryCache(store)),
            ),
            Effect.provide(PsdGateTest),
            Effect.provide(testEnvLayer),
          ),
        ),
      );

    expect((await read())._tag).toBe("Right");
    answer = [];
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000); // past TTL.RANKING
    await read(); // inline refresh answers empty

    expect(store.has("ranking:none:team:1")).toBe(false);
  });

  // #3059 follow-up — "stale is the floor" (#2321) for the note too. Once it
  // expires, the next read needs PSD; if PSD's quota is spent at that moment
  // the team still has no table, so the expired note answers.
  describe("an expired no-table note", () => {
    const expiredNote = () =>
      new Map([
        ["ranking:none:team:1", String(Date.now() - 25 * 60 * 60 * 1000)],
      ]);
    const readWith = (
      store: Map<string, string>,
      getRanking: PsdServiceInterface["getRanking"],
    ) =>
      Effect.runPromise(
        Effect.either(
          getRankingHandler(1).pipe(
            Effect.provide(
              Layer.succeed(PsdService, makeServiceMock({ getRanking })),
            ),
            Effect.provide(
              Layer.succeed(KvCacheService, makeMemoryCache(store)),
            ),
            Effect.provide(PsdGateTest),
            Effect.provide(testEnvLayer),
          ),
        ),
      );

    it("still answers 404 when PSD is down", async () => {
      let psdCalls = 0;
      const result = await readWith(expiredNote(), () => {
        psdCalls++;
        return Effect.fail(
          new UpstreamUnavailableError({ message: "HTTP 429", status: 429 }),
        );
      });
      expect(psdCalls).toBe(1); // it did try PSD first
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("ResourceNotFound");
      }
    });

    it("gives way to a table PSD now publishes", async () => {
      const result = await readWith(expiredNote(), () =>
        Effect.succeed(rankingTables),
      );
      expect(result._tag).toBe("Right");
    });

    it("still reports PSD being down when there was never a note", async () => {
      const result = await readWith(new Map(), () =>
        Effect.fail(
          new UpstreamUnavailableError({ message: "HTTP 429", status: 429 }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("UpstreamUnavailable");
      }
    });
  });

  it("propagates UpstreamUnavailableError from service", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        getRankingHandler(1).pipe(
          Effect.provide(
            Layer.succeed(
              PsdService,
              makeServiceMock({
                getRanking: () =>
                  Effect.fail(
                    new UpstreamUnavailableError({
                      message: "PSD returned 503",
                      status: 503,
                    }),
                  ),
              }),
            ),
          ),
          Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
          Effect.provide(PsdGateTest),
          Effect.provide(testEnvLayer),
        ),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });
});
