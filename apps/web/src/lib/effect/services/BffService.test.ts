import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect } from "effect";
import { BffService, BffServiceLive } from "./BffService";

// `cachedRead` wraps the hot reads in `unstable_cache`; there's no Next request
// scope in vitest, so stub it to a pass-through. The encode/decode round-trip
// inside `cachedRead` still runs — see the `Date`-restoration assertion below.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

// Minimal fixture that satisfies the Match schema from @kcvv/api-contract.
// date/time must be ISO strings because JSON.stringify converts Date objects.
const sampleMatch = {
  id: 1,
  date: "2025-09-01T15:00:00.000Z",
  time: "15:00",
  venue: undefined,
  home_team: {
    id: 10,
    name: "KCVV Elewijt",
    score: undefined,
    logo: undefined,
  },
  away_team: { id: 20, name: "Opponent FC", score: undefined, logo: undefined },
  status: "scheduled",
  competition: "LEAGUE",
  squadLabel: undefined,
};

const sampleRankingEntry = {
  position: 1,
  team_id: 10,
  team_name: "KCVV Elewijt",
  team_logo: "https://example.com/logo.png",
  played: 5,
  won: 4,
  drawn: 1,
  lost: 0,
  goals_for: 10,
  goals_against: 3,
  goal_difference: 7,
  points: 13,
  form: undefined,
};

function mockFetchWith(data: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

describe("BffService", () => {
  beforeEach(() => vi.stubEnv("KCVV_API_URL", "http://localhost:3001"));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("getMatches calls /matches/:teamId and returns decoded matches", async () => {
    mockFetchWith([sampleMatch]);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatches(1);
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("/matches/1") }),
      expect.any(Object),
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
    // Date survives the cachedRead encode→(JSON cache)→decode round-trip
    // (Match.date is DateFromStringOrDate; a naive unstable_cache wrap would
    // leave it a string).
    expect(result[0]?.date).toBeInstanceOf(Date);
  });

  it("getNextMatches calls /matches/next", async () => {
    mockFetchWith([sampleMatch]);

    await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getNextMatches();
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("/matches/next"),
      }),
      expect.any(Object),
    );
  });

  it("getMatchesWindow calls /matches/window", async () => {
    mockFetchWith([sampleMatch]);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatchesWindow();
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("/matches/window"),
      }),
      expect.any(Object),
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });

  it("getMatchDetail calls /match/:matchId/detail", async () => {
    const sampleDetail = {
      ...sampleMatch,
      hasReport: false,
      lineup: undefined,
    };
    mockFetchWith(sampleDetail);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatchDetail(42);
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("/match/42/detail"),
      }),
      expect.any(Object),
    );
    // Date survives the cachedRead round-trip (getMatchDetail is cached too).
    expect(result.date).toBeInstanceOf(Date);
  });

  it("getRanking calls /ranking/:teamId and returns decoded entries", async () => {
    mockFetchWith([sampleRankingEntry]);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getRanking(1);
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("/ranking/1") }),
      expect.any(Object),
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.team_name).toBe("KCVV Elewijt");
  });

  it("preserves the error's _tag through the cache wrap, with no extra BFF call", async () => {
    // A BFF failure is captured as a Cause (runPromiseExit) and re-raised via
    // failCause, so the original *tagged* error reaches the call site without a
    // re-run — guarding the ploegen/[slug]/wedstrijden
    // `catchTag("HttpNotFound") → notFound()` path. We assert on the specific tag
    // (not catchAll): a naive Promise round-trip flattens the error to an opaque
    // UnknownException, so catchTag would miss and fall through to "flattened" —
    // i.e. the test FAILS against the bug, not just passes against the fix. (A
    // 500 is decoded against the declared error union and fails as a ParseError.)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 500 })),
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatches(1).pipe(
          Effect.catchTag("ParseError", () =>
            Effect.succeed("typed-survived" as const),
          ),
          Effect.catchAll(() => Effect.succeed("flattened" as const)),
        );
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(result).toBe("typed-survived");
    // The failed effect runs once inside the cache fn and is re-raised from its
    // captured Cause — no raw-effect re-run, so the BFF is hit exactly once.
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("propagates errors as Effect failures (not exceptions)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 500 })),
    );

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatches(1);
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(exit._tag).toBe("Failure");
  });

  it("getRelated calls /related?id=xxx and returns decoded items", async () => {
    const sampleRelated = [
      {
        id: "doc-1",
        slug: "some-article",
        type: "article",
        score: 0.85,
        title: "Related Article",
        excerpt: "A related article excerpt",
      },
      {
        id: "doc-2",
        slug: "some-page",
        type: "page",
        score: 0.72,
        title: "Related Page",
        excerpt: "A related page excerpt",
      },
    ];
    mockFetchWith(sampleRelated);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getRelated("abc-123");
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("/related"),
      }),
      expect.any(Object),
    );
    expect(result).toHaveLength(2);
    expect(result[0]?.title).toBe("Related Article");
    expect(result[1]?.type).toBe("page");
  });

  it("getRelated passes limit param", async () => {
    mockFetchWith([]);

    await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getRelated("abc-123", 2);
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("limit=2"),
      }),
      expect.any(Object),
    );
  });

  it("getPlayerStats calls /statistics/player/:memberId and returns decoded stats", async () => {
    const samplePlayerStats = {
      memberId: 42,
      teams: [
        {
          team: "A-team",
          gamesPlayed: 10,
          gamesWon: 5,
          gamesEqual: 3,
          gamesLost: 2,
          goals: 4,
          assists: 2,
          yellowCards: 1,
          redCards: 0,
          minutes: 900,
        },
      ],
    };
    mockFetchWith(samplePlayerStats);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getPlayerStats(42);
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("/statistics/player/42"),
      }),
      expect.any(Object),
    );
    expect(result.memberId).toBe(42);
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0]?.goals).toBe(4);
  });

  it("throws when KCVV_API_URL is missing", async () => {
    vi.stubEnv("KCVV_API_URL", "   ");

    await expect(
      Effect.runPromise(
        Effect.gen(function* () {
          const bff = yield* BffService;
          return yield* bff.getMatches(1);
        }).pipe(Effect.provide(BffServiceLive)),
      ),
    ).rejects.toThrow(/KCVV_API_URL is not set/);
  });
});
