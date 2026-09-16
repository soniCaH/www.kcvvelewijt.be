import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect, Runtime, Cause } from "effect";
import { BffService, BffServiceLive } from "./BffService";
import { isPermanentBffFailure } from "@/lib/effect/classify-bff-failure";

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

const sampleRankingTable = {
  competition_id: 222464,
  competition_name: "3de Afdeling Voetb Vl A",
  entries: [
    {
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
    },
  ],
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

/** Like `mockFetchWith`, but the caller controls the raw body text —
 * for reproducing an empty or non-JSON body on a declared-error status. */
function mockFetchWithRawBody(body: string, status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(body, { status })),
  );
}

/**
 * Runs `bff.getRanking(1)` against whatever `fetch` stub is currently
 * installed and reports both how the failure classifies (per
 * `isPermanentBffFailure`) and its `_tag`, mirroring
 * `classify-bff-failure.test.ts`'s `runAndCatch` helper — but through the
 * real `BffServiceLive` client rather than a synthetic fixture, so it
 * exercises the actual decode path a stale/misconfigured worker hits.
 */
async function runRankingAndClassify(): Promise<{
  tag: unknown;
  permanent: boolean;
}> {
  try {
    await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getRanking(1);
      }).pipe(Effect.provide(BffServiceLive)),
    );
  } catch (error) {
    const permanent = isPermanentBffFailure(error);
    // Mirror classify-bff-failure.ts's own unwrap so the tag we assert on is
    // read the same way the classifier reads it, not by a second guess.
    const tag = Runtime.isFiberFailure(error)
      ? (Cause.squash(error[Runtime.FiberFailureCauseId]) as { _tag?: unknown })
          ?._tag
      : undefined;
    return { tag, permanent };
  }
  throw new Error("expected getRanking to fail");
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
    // Match.date is DateFromStringOrDate — it decodes to a real Date.
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
    expect(result.date).toBeInstanceOf(Date);
  });

  it("getRanking calls /ranking/:teamId and returns decoded tables", async () => {
    mockFetchWith([sampleRankingTable]);

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
    expect(result[0]?.competition_name).toBe("3de Afdeling Voetb Vl A");
    expect(result[0]?.entries[0]?.team_name).toBe("KCVV Elewijt");
  });

  it("preserves the error's _tag, with exactly one BFF call", async () => {
    // The typed error reaches the call site un-flattened — guarding the
    // ploegen/[slug]/wedstrijden `catchTag("HttpNotFound") → notFound()` path.
    // We assert on the specific tag (not catchAll): anything that flattens the
    // error to an opaque UnknownException would fall through to "flattened".
    // A 503 is a status `getMatches` declares (see
    // packages/api-contract/src/api/matches.ts), so this exercises a real
    // round-trip through the client's decode map -- the server-declared
    // status is read back off the response and the body decodes as the
    // matching HttpServiceUnavailable class. This is the only test in the
    // suite that pins that path for a non-404 declared error; see the test
    // below for the 404/HttpNotFound path, and the one after for what
    // happens on a status the endpoint does NOT declare.
    mockFetchWith(
      {
        error: "Service temporarily unavailable",
        _tag: "HttpServiceUnavailable",
      },
      503,
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatches(1).pipe(
          Effect.catchTag("HttpServiceUnavailable", () =>
            Effect.succeed("typed-survived" as const),
          ),
          Effect.catchAll(() => Effect.succeed("flattened" as const)),
        );
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(result).toBe("typed-survived");
    // One read, one BFF call — nothing retries or re-runs on the error path.
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("an undeclared status surfaces as an untyped ResponseError, not a decode error", async () => {
    // `getMatches` declares errors for 503/502/404 only (see
    // packages/api-contract/src/api/matches.ts), so a bare 500 -- which none
    // of those cover -- never reaches the declared error union at all. The
    // client's `HttpApiClient` surfaces it as `ResponseError`
    // (`@effect/platform/HttpClientError`'s "ResponseError" tag), not a
    // decode failure. This pins the mechanism the #2440 deploy-order section
    // relies on: an undecodable status "falls through ... and surfaces as an
    // untyped `ResponseError`", which classifies as transient (not in
    // PERMANENT_BFF_TAGS) and throws for ISR to retry.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 500 })),
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatches(1).pipe(
          Effect.catchTag("ResponseError", () =>
            Effect.succeed("untyped-response-error" as const),
          ),
          Effect.catchAll(() => Effect.succeed("flattened" as const)),
        );
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(result).toBe("untyped-response-error");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("surfaces a missing match as a typed HttpNotFound at the call site", async () => {
    // The invariant behind `catchTag("HttpNotFound") → notFound()` at
    // wedstrijd/[matchId] (and the empty-array fallbacks at sitemap.ts,
    // ploegen/[slug]/wedstrijden, share, tegenstander).
    //
    // The wire status is 404, matching `HttpNotFound`'s declared status.
    // `packages/api-contract/src/schemas/http-errors.ts` attaches it via
    // `HttpApiSchema.annotations({ status })`, which is the annotation
    // `@effect/platform` actually reads to both serve and decode the
    // response — so the client's decode map has a 404 entry and this
    // resolves through the typed `HttpNotFound` branch below rather than
    // falling through to an untyped `ResponseError`.
    mockFetchWith({ error: "Not found", _tag: "HttpNotFound" }, 404);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatchDetail(999).pipe(
          Effect.catchTag("HttpNotFound", () =>
            Effect.succeed("not-found" as const),
          ),
          Effect.catchAll(() => Effect.succeed("flattened" as const)),
        );
      }).pipe(Effect.provide(BffServiceLive)),
    );

    expect(result).toBe("not-found");
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

  // #2924: fixing #2440 made `HttpNotFound` (and its 502/503/400 siblings) a
  // genuine decode-map entry keyed on status. A response whose status
  // matches one of those but whose body is NOT the BFF's own `{ error,
  // _tag }` shape — a stale/misconfigured worker's unmatched-route reply,
  // which is a normal state here (apps/api deploys prod-on-merge,
  // staging-on-PR-only) — used to fall through as an untyped, transient
  // `ResponseError` (pre-#2440). After #2440 it decodes-fails against the
  // declared error schema and surfaces as a bare `ParseError`, which
  // `PERMANENT_BFF_TAGS` treats as permanent, so `degradeIfPermanent` /
  // `isPermanentBffFailure` swallow it silently and forever instead of
  // throwing for ISR to retry. These cases must go back to transient without
  // making every `ParseError` transient (that would re-break what #2440 and
  // its predecessors settled — see the two "stays permanent" cases below).
  describe("declared-status responses whose body is not the BFF's own shape (#2924)", () => {
    it("empty-body 404 classifies as transient, not permanent", async () => {
      mockFetchWithRawBody("", 404);

      const { tag, permanent } = await runRankingAndClassify();

      expect(permanent).toBe(false);
      expect(tag).toBe("ResponseError");
    });

    it("HTML-body 404 classifies as transient, not permanent", async () => {
      mockFetchWithRawBody("<html><body>404 Not Found</body></html>", 404);

      const { tag, permanent } = await runRankingAndClassify();

      expect(permanent).toBe(false);
      expect(tag).toBe("ResponseError");
    });

    it("empty-body 502 classifies as transient, not permanent (not 404-specific)", async () => {
      mockFetchWithRawBody("", 502);

      const { tag, permanent } = await runRankingAndClassify();

      expect(permanent).toBe(false);
      expect(tag).toBe("ResponseError");
    });

    it("empty-body 500 (an undeclared status) still classifies as transient — unchanged", async () => {
      mockFetchWithRawBody("", 500);

      const { tag, permanent } = await runRankingAndClassify();

      expect(permanent).toBe(false);
      expect(tag).toBe("ResponseError");
    });

    it("a genuine BFF error body still decodes to its typed class and classifies as permanent — unchanged", async () => {
      mockFetchWith({ error: "Not found", _tag: "HttpNotFound" }, 404);

      const { tag, permanent } = await runRankingAndClassify();

      expect(permanent).toBe(true);
      expect(tag).toBe("HttpNotFound");
    });

    it("a success-status body that fails the success schema stays a permanent ParseError — unchanged", async () => {
      // 200, but shaped nothing like RankingTableArray. This is a real
      // contract-mismatch ParseError (this deploy can't decode a genuine BFF
      // response) and must NOT be reclassified by the #2924 fix — only the
      // declared-error-status guard above changes.
      mockFetchWith({ not: "a ranking table" }, 200);

      const { tag, permanent } = await runRankingAndClassify();

      expect(permanent).toBe(true);
      expect(tag).toBe("ParseError");
    });
  });
});
