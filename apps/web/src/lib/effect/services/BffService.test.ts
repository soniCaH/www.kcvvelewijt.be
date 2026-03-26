import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect } from "effect";
import { BffService, BffServiceLive } from "./BffService";

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

  it("getMatchDetail calls /match/:matchId/detail", async () => {
    const sampleDetail = {
      ...sampleMatch,
      hasReport: false,
      lineup: undefined,
    };
    mockFetchWith(sampleDetail);

    await Effect.runPromise(
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

  it("getMatchById calls /match/:matchId and returns decoded match", async () => {
    mockFetchWith(sampleMatch);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatchById(42);
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("/match/42") }),
      expect.any(Object),
    );
    expect(result.id).toBe(1);
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
