import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer, Logger, Schema as S } from "effect";
import { PsdService, PsdServiceLive } from "./service";
import { Match, MatchDetail, RankingEntry } from "@kcvv/api-contract";
import { UpstreamUnavailableError, type BffError } from "./errors";
import { WorkerEnvTag } from "../env";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import {
  SanityProjection,
  type SanityProjectionInterface,
} from "../sanity/projection";

global.fetch = vi.fn();

function makeEnvLayer() {
  return Layer.succeed(WorkerEnvTag, {
    PSD_API_BASE_URL: "https://clubapi.prosoccerdata.com",
    PSD_IMAGE_BASE_URL: "https://kcvv.prosoccerdata.com",
    FOOTBALISTO_LOGO_CDN_URL: "https://cdn.example.com",
    PSD_API_KEY: "test-key",
    PSD_API_CLUB: "test-club",
    PSD_API_AUTH: "test-auth",
    PSD_CACHE: {} as KVNamespace,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "test",
    SANITY_API_TOKEN: "test-token",
    SANITY_WEBHOOK_SECRET: "",
    AI: {} as Ai,
    SEARCH_INDEX: {} as VectorizeIndex,
  });
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
};

function makeSanityMock(
  visiblePsdIds: string[] = ["1"],
): SanityProjectionInterface {
  return {
    getPlayersImageState: () => Effect.succeed(new Map()),
    getActivePlayerPsdIds: () => Effect.succeed([]),
    getActiveStaffPsdIds: () => Effect.succeed([]),
    getActiveTeamPsdIds: () => Effect.succeed([]),
    getVisibleTeamPsdIds: () => Effect.succeed(visiblePsdIds),
    getProtectedStaffPsdIds: () => Effect.succeed([]),
  };
}

const seasons = [
  {
    id: 42,
    name: "2024-2025",
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

const rawTeams = [
  {
    id: 1,
    name: "KCVV Elewijt A",
    age: "A",
    gender: "mannen",
    footbelId: 123,
    active: true,
  },
  {
    id: 23,
    name: "Weitse Gans",
    age: "A",
    gender: "mannen",
    footbelId: null,
    active: true,
  },
];

const rawFutureGame = {
  id: 102,
  status: 0,
  date: "2099-12-31 00:00",
  time: "15:00",
  homeClub: { id: 123, name: "KCVV Elewijt" },
  awayClub: { id: 456, name: "Opponent FC" },
  goalsHomeTeam: null,
  goalsAwayTeam: null,
  competitionType: { id: 1, name: "3de Nationale", type: "LEAGUE" },
};

const rawMatchList = {
  content: [
    {
      id: 101,
      status: 0,
      date: "2025-01-15 00:00",
      time: "15:00",
      homeClub: { id: 123, name: "KCVV Elewijt" },
      awayClub: { id: 456, name: "Opponent FC" },
      goalsHomeTeam: 3,
      goalsAwayTeam: 1,
      competitionType: { id: 1, name: "3de Nationale", type: "LEAGUE" },
    },
  ],
};

const rawFutureMatchList = { content: [rawFutureGame] };

const rawDetailResponse = {
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

function runService<A>(
  fn: (svc: (typeof PsdService)["Service"]) => Effect.Effect<A, BffError>,
  options: {
    sanityMock?: SanityProjectionInterface;
    kvMock?: KvCacheInterface;
  } = {},
) {
  const sanity = options.sanityMock ?? makeSanityMock();
  const kv = options.kvMock ?? cacheMock;
  const program = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* fn(service);
  });
  return Effect.runPromise(
    Effect.either(
      program.pipe(
        Effect.provide(PsdServiceLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, kv)),
        Effect.provide(Layer.succeed(SanityProjection, sanity)),
      ),
    ),
  );
}

describe("PsdService.getTeamMatches", () => {
  it("returns normalized Match array from mocked HTTP responses", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({ ok: true, json: async () => rawMatchList });

    const result = await runService((svc) => svc.getTeamMatches(1));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right).toHaveLength(1);
      expect(result.right[0]?.id).toBe(101);
      expect(result.right[0]?.status).toBe("finished");
      expect(result.right[0]?.home_team.name).toBe("KCVV Elewijt");
      expect(result.right[0]?.competition).toBe("Competitie");
      // Contract boundary: validate transform output against api-contract schema
      expect(() => S.decodeUnknownSync(Match)(result.right[0])).not.toThrow();
    }
  });

  it("maps CUP match competition to PSD name", async () => {
    const cupMatchList = {
      content: [
        {
          id: 201,
          status: 0,
          date: "2025-02-10 00:00",
          time: "15:00",
          homeClub: { id: 123, name: "KCVV Elewijt" },
          awayClub: { id: 456, name: "Opponent FC" },
          goalsHomeTeam: null,
          goalsAwayTeam: null,
          competitionType: { id: 5, name: "Beker van Brabant", type: "CUP" },
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({ ok: true, json: async () => cupMatchList });

    const result = await runService((svc) => svc.getTeamMatches(1));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right[0]?.competition).toBe("Beker van Brabant");
    }
  });

  it("maps FRIENDLY match competition to 'Vriendschappelijk'", async () => {
    const friendlyMatchList = {
      content: [
        {
          id: 301,
          status: 0,
          date: "2025-03-01 00:00",
          time: "14:00",
          homeClub: { id: 123, name: "KCVV Elewijt" },
          awayClub: { id: 456, name: "Opponent FC" },
          goalsHomeTeam: null,
          goalsAwayTeam: null,
          competitionType: { id: 9, name: null, type: "FRIENDLY" },
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({ ok: true, json: async () => friendlyMatchList });

    const result = await runService((svc) => svc.getTeamMatches(1));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right[0]?.competition).toBe("Vriendschappelijk");
    }
  });

  it("filters invalid games and returns only valid ones", async () => {
    const ghostGame = {
      id: 999,
      status: 0,
      date: "2025-01-20 00:00",
      time: "15:00",
      homeClub: null, // ghost match — null club data
      awayClub: null,
      goalsHomeTeam: null,
      goalsAwayTeam: null,
      competitionType: null,
    };
    const mixedMatchList = {
      content: [rawMatchList.content[0], ghostGame],
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({ ok: true, json: async () => mixedMatchList });

    const result = await runService((svc) => svc.getTeamMatches(1));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      // Should return only the valid game, ghost game filtered out
      expect(result.right).toHaveLength(1);
      expect(result.right[0]?.id).toBe(101);
    }
  });

  it("sets is_home: true when homeTeamId matches the queried teamId", async () => {
    const homeGame = {
      ...rawMatchList.content[0],
      id: 201,
      teamId: 7,
      homeTeamId: 7,
      awayTeamId: 8,
    };
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [homeGame] }),
      });

    const result = await runService((svc) => svc.getTeamMatches(7));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right[0]?.is_home).toBe(true);
    }
  });

  it("sets is_home: false when awayTeamId matches the queried teamId", async () => {
    const awayGame = {
      ...rawMatchList.content[0],
      id: 202,
      teamId: 8,
      homeTeamId: 7,
      awayTeamId: 8,
    };
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [awayGame] }),
      });

    const result = await runService((svc) => svc.getTeamMatches(8));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right[0]?.is_home).toBe(false);
    }
  });

  it("leaves is_home undefined when homeTeamId is not present", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({ ok: true, json: async () => rawMatchList });

    const result = await runService((svc) => svc.getTeamMatches(1));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right[0]?.is_home).toBeUndefined();
    }
  });

  it("sets is_home: true using queried teamId when payload teamId is absent", async () => {
    const gameWithoutTeamId = {
      ...rawMatchList.content[0],
      id: 203,
      homeTeamId: 7,
      awayTeamId: 8,
    };
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [gameWithoutTeamId] }),
      });

    const result = await runService((svc) => svc.getTeamMatches(7));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right[0]?.is_home).toBe(true);
    }
  });

  it("fails when season fetch fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const result = await runService((svc) => svc.getTeamMatches(1));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });
});

describe("PsdService.getNextMatches", () => {
  it("fetches next match per visible team, returns transformed Matches", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string) => {
      // Match team-specific game endpoints before the season endpoint (URL contains /seasons too)
      if (url.includes("/games/team/")) {
        return Promise.resolve({
          ok: true,
          json: async () => rawFutureMatchList,
        });
      }
      if (url.includes("/seasons")) {
        return Promise.resolve({ ok: true, json: async () => seasons });
      }
      // /teams list endpoint — rawTeams includes team 1 (visible) and team 23 (not visible)
      return Promise.resolve({ ok: true, json: async () => rawTeams });
    });

    // Default sanityMock returns ["1"] — only team 1 is visible, team 23 is excluded
    const result = await runService((svc) => svc.getNextMatches());

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      // Team 23 not in Sanity visible list — only team 1 returns a match
      expect(result.right).toHaveLength(1);
      expect(result.right[0]?.id).toBe(102);
      expect(result.right[0]?.status).toBe("scheduled");
      // kcvv_team_id should be the PSD team ID (1), not the club ID
      expect(result.right[0]?.kcvv_team_id).toBe(1);
      // kcvv_team_label derived from team name/age
      expect(result.right[0]?.kcvv_team_label).toBe("A-Ploeg");
      // Contract boundary: validate transform output against api-contract schema
      for (const match of result.right) {
        expect(() => S.decodeUnknownSync(Match)(match)).not.toThrow();
      }
    }
  });

  it("filters invalid games from team match lists", async () => {
    const ghostGame = {
      id: 888,
      status: 0,
      date: "2099-12-31 00:00",
      time: "15:00",
      homeClub: null,
      awayClub: null,
      goalsHomeTeam: null,
      goalsAwayTeam: null,
      competitionType: null,
    };
    const mixedFutureMatchList = {
      content: [rawFutureGame, ghostGame],
    };

    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/games/team/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mixedFutureMatchList,
        });
      }
      if (url.includes("/seasons")) {
        return Promise.resolve({ ok: true, json: async () => seasons });
      }
      return Promise.resolve({ ok: true, json: async () => [rawTeams[0]] });
    });

    const result = await runService((svc) => svc.getNextMatches());

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      // Ghost game should be filtered, valid future game returned
      expect(result.right).toHaveLength(1);
      expect(result.right[0]?.id).toBe(102);
    }
  });

  it("fails with UpstreamUnavailableError when all team fetches fail", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/games/team/")) {
        return Promise.resolve({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
        });
      }
      if (url.includes("/seasons")) {
        return Promise.resolve({ ok: true, json: async () => seasons });
      }
      // /teams — only team 1 (visible per default sanityMock)
      return Promise.resolve({ ok: true, json: async () => [rawTeams[0]] });
    });

    const result = await runService((svc) => svc.getNextMatches());

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });

  it("excludes teams with no future matches", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/games/team/")) {
        return Promise.resolve({ ok: true, json: async () => rawMatchList });
      }
      if (url.includes("/seasons")) {
        return Promise.resolve({ ok: true, json: async () => seasons });
      }
      // /teams list — only one team
      return Promise.resolve({ ok: true, json: async () => [rawTeams[0]] });
    });

    const result = await runService((svc) => svc.getNextMatches());

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right).toHaveLength(0);
    }
  });

  it("uses Sanity showInNavigation to filter teams, not hardcoded IDs", async () => {
    const threeTeams = [
      rawTeams[0], // id: 1 — visible in Sanity
      {
        id: 2,
        name: "KCVV B-Ploeg",
        age: "A",
        gender: "mannen",
        footbelId: null,
        active: true,
      },
      rawTeams[1], // id: 23 — NOT visible in Sanity
    ];
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/games/team/")) {
        return Promise.resolve({
          ok: true,
          json: async () => rawFutureMatchList,
        });
      }
      if (url.includes("/seasons")) {
        return Promise.resolve({ ok: true, json: async () => seasons });
      }
      return Promise.resolve({ ok: true, json: async () => threeTeams });
    });

    // Only team 1 is visible in Sanity (team 2 and 23 excluded)
    const sanityMock = makeSanityMock(["1"]);
    const result = await runService((svc) => svc.getNextMatches(), {
      sanityMock,
    });

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      // Team 2 and team 23 must both be excluded — only team 1 is in the Sanity visible list
      expect(result.right).toHaveLength(1);
      expect(result.right[0]?.kcvv_team_id).toBe(1);
    }
  });

  it("caches visible team PSD IDs in KV with 1h TTL on cache miss", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/games/team/")) {
        return Promise.resolve({
          ok: true,
          json: async () => rawFutureMatchList,
        });
      }
      if (url.includes("/seasons")) {
        return Promise.resolve({ ok: true, json: async () => seasons });
      }
      return Promise.resolve({ ok: true, json: async () => [rawTeams[0]] });
    });

    let capturedKey: string | undefined;
    let capturedValue: string | undefined;
    let capturedTtl: number | undefined;
    const trackingKv: KvCacheInterface = {
      get: () => Effect.succeed(null), // cache miss
      set: (key, value, ttl) => {
        if (key.includes("visible-team")) {
          capturedKey = key;
          capturedValue = value;
          capturedTtl = ttl;
        }
        return Effect.succeed(undefined);
      },
      increment: () => Effect.succeed(undefined),
    };

    const sanityMock = makeSanityMock(["1"]);
    await runService((svc) => svc.getNextMatches(), {
      sanityMock,
      kvMock: trackingKv,
    });

    expect(capturedKey).toBeDefined();
    expect(JSON.parse(capturedValue!)).toEqual(["1"]);
    expect(capturedTtl).toBe(3600);
  });

  it("uses KV-cached visible team IDs and skips Sanity on cache hit", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/games/team/")) {
        return Promise.resolve({
          ok: true,
          json: async () => rawFutureMatchList,
        });
      }
      if (url.includes("/seasons")) {
        return Promise.resolve({ ok: true, json: async () => seasons });
      }
      return Promise.resolve({ ok: true, json: async () => [rawTeams[0]] });
    });

    // KV already has cached visible IDs
    const cachedIds = JSON.stringify(["1"]);
    const hitKv: KvCacheInterface = {
      get: (key) =>
        key.includes("visible-team")
          ? Effect.succeed(cachedIds)
          : Effect.succeed(null),
      set: () => Effect.succeed(undefined),
      increment: () => Effect.succeed(undefined),
    };

    let sanityCallCount = 0;
    const spySanityMock: SanityProjectionInterface = {
      ...makeSanityMock(["1"]),
      getVisibleTeamPsdIds: () => {
        sanityCallCount++;
        return Effect.succeed(["1"]);
      },
    };

    await runService((svc) => svc.getNextMatches(), {
      sanityMock: spySanityMock,
      kvMock: hitKv,
    });

    // Sanity should NOT be called when KV has cached data
    expect(sanityCallCount).toBe(0);
  });
});

describe("PsdService.getMatchById", () => {
  it("returns normalized Match (no lineup) from mocked HTTP response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => rawDetailResponse,
    });

    const result = await runService((svc) => svc.getMatchById(99));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.id).toBe(99);
      expect(result.right.status).toBe("finished");
      expect(result.right.home_team.name).toBe("KCVV Elewijt");
      expect("lineup" in result.right).toBe(false);
      // Contract boundary: validate transform output against api-contract schema
      expect(() => S.decodeUnknownSync(Match)(result.right)).not.toThrow();
    }
  });

  it("fails with ResourceNotFoundError when match detail fetch returns HTTP 404", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const result = await runService((svc) => svc.getMatchById(99));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });
});

const rawRankingCompetitions = [
  {
    name: "Beker van Brabant",
    type: "CUP",
    teams: [
      {
        id: 1,
        rank: 1,
        matchesPlayed: 3,
        wins: 2,
        draws: 1,
        losses: 0,
        goalsScored: 5,
        goalsConceded: 2,
        points: 7,
        team: {
          id: 10,
          club: { id: 100, localName: "Cup Team", name: "Cup Team" },
        },
      },
    ],
  },
  {
    name: "3de Nationale",
    type: "LEAGUE",
    teams: [
      {
        id: 2,
        rank: 1,
        matchesPlayed: 20,
        wins: 15,
        draws: 3,
        losses: 2,
        goalsScored: 45,
        goalsConceded: 12,
        points: 48,
        team: {
          id: 20,
          club: { id: 200, localName: "KCVV Elewijt", name: "KCVV" },
        },
      },
      {
        id: 3,
        rank: 2,
        matchesPlayed: 20,
        wins: 12,
        draws: 4,
        losses: 4,
        goalsScored: 38,
        goalsConceded: 18,
        points: 40,
        team: {
          id: 30,
          club: { id: 300, localName: "Rival FC", name: "Rival" },
        },
      },
    ],
  },
];

describe("PsdService.getRanking", () => {
  it("prefers non-CUP, non-FRIENDLY competition and returns transformed RankingEntry[]", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => rawRankingCompetitions,
    });

    const result = await runService((svc) =>
      svc.getRanking(1, "https://cdn.example.com"),
    );

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right).toHaveLength(2);
      expect(result.right[0]?.team_name).toBe("KCVV Elewijt");
      expect(result.right[0]?.position).toBe(1);
      expect(result.right[0]?.points).toBe(48);
      expect(result.right[0]?.team_logo).toBe(
        "https://cdn.example.com/extra_groot/200.png",
      );
      // Contract boundary: validate transform output against api-contract schema
      for (const entry of result.right) {
        expect(() => S.decodeUnknownSync(RankingEntry)(entry)).not.toThrow();
      }
    }
  });
  it("falls back to CUP competition when no LEAGUE/other exists", async () => {
    const cupOnly = [
      {
        name: "Beker van Brabant",
        type: "CUP",
        teams: [
          {
            id: 1,
            rank: 1,
            matchesPlayed: 3,
            wins: 2,
            draws: 1,
            losses: 0,
            goalsScored: 5,
            goalsConceded: 2,
            points: 7,
            team: {
              id: 10,
              club: { id: 100, localName: "Cup Team", name: "Cup Team" },
            },
          },
        ],
      },
    ];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => cupOnly,
    });

    const result = await runService((svc) =>
      svc.getRanking(1, "https://cdn.example.com"),
    );

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right).toHaveLength(1);
      expect(result.right[0]?.team_name).toBe("Cup Team");
    }
  });

  it("returns empty array when no competitions have teams", async () => {
    const noTeams = [{ name: "Empty League", type: "LEAGUE", teams: [] }];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => noTeams,
    });

    const result = await runService((svc) =>
      svc.getRanking(1, "https://cdn.example.com"),
    );

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right).toHaveLength(0);
    }
  });

  it("filters invalid ranking entries and returns only valid ones", async () => {
    const invalidEntry = {
      id: 999,
      rank: 3,
      matchesPlayed: 10,
      wins: 5,
      draws: 2,
      losses: 3,
      goalsScored: 12,
      goalsConceded: 8,
      points: 17,
      team: null, // invalid — null team/club data
    };
    const mixedRanking = [
      {
        name: "3de Nationale",
        type: "LEAGUE",
        teams: [rawRankingCompetitions[1]!.teams[0], invalidEntry],
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mixedRanking,
    });

    const result = await runService((svc) =>
      svc.getRanking(1, "https://cdn.example.com"),
    );

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      // Should return only the valid entry, invalid one filtered out
      expect(result.right).toHaveLength(1);
      expect(result.right[0]?.team_name).toBe("KCVV Elewijt");
    }
  });

  it("logs invalid ranking entries when some are filtered", async () => {
    const invalidEntry = {
      id: 999,
      rank: 3,
      team: null, // invalid
    };
    const mixedRanking = [
      {
        name: "3de Nationale",
        type: "LEAGUE",
        teams: [rawRankingCompetitions[1]!.teams[0], invalidEntry],
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mixedRanking,
    });

    const messages: string[] = [];
    const TestLogger = Logger.make(({ message }) => {
      messages.push(String(message));
    });

    await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* PsdService;
        return yield* svc.getRanking(1, "https://cdn.example.com");
      }).pipe(
        Effect.provide(PsdServiceLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
        Effect.provide(Layer.succeed(SanityProjection, makeSanityMock())),
        Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
      ),
    );

    expect(
      messages.some((m) => m.includes("filtered") && m.includes("IDs: [999]")),
    ).toBe(true);
  });

  it("fails with ResourceNotFoundError when all ranking entries are invalid", async () => {
    const allInvalid = [
      {
        name: "3de Nationale",
        type: "LEAGUE",
        teams: [
          { id: 1, rank: 1, team: null }, // invalid
          { id: 2, rank: 2, team: null }, // invalid
        ],
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => allInvalid,
    });

    const result = await runService((svc) =>
      svc.getRanking(1, "https://cdn.example.com"),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });
});

describe("PsdService.getMatchDetail", () => {
  it("maps LEAGUE competitionType string to 'Competitie'", async () => {
    const leagueDetailResponse = {
      general: {
        ...rawDetailResponse.general,
        competitionType: { id: 1, name: null, type: "LEAGUE" },
      },
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => leagueDetailResponse,
    });

    const result = await runService((svc) => svc.getMatchDetail(99));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.competition).toBe("Competitie");
    }
  });

  it("returns normalized MatchDetail from mocked HTTP response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => rawDetailResponse,
    });

    const result = await runService((svc) => svc.getMatchDetail(99));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.id).toBe(99);
      expect(result.right.hasReport).toBe(true);
      expect(result.right.status).toBe("finished");
      expect(result.right.home_team.score).toBe(2);
      // Contract boundary: validate transform output against api-contract schema
      expect(() =>
        S.decodeUnknownSync(MatchDetail)(result.right),
      ).not.toThrow();
    }
  });

  it("fails with UpstreamUnavailableError when match detail fetch returns HTTP 500", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await runService((svc) => svc.getMatchDetail(99));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
      expect((result.left as UpstreamUnavailableError).status).toBe(500);
    }
  });
});

const rawDetailWithGoal = {
  general: {
    id: 123,
    date: "2025-03-15 15:00",
    homeClub: { id: 100, name: "KCVV Elewijt" },
    awayClub: { id: 200, name: "Opponent FC" },
    goalsHomeTeam: 1,
    goalsAwayTeam: 0,
    competitionType: "3de Nationale",
    viewGameReport: false,
    status: 0,
  },
  events: [
    {
      action: { type: "GOAL", subtype: null, id: 10 },
      minute: 23,
      playerId: 55,
      playerName: "De Smet",
      clubId: 100,
    },
  ],
};

describe("PsdService.getMatchDetail - events", () => {
  it("includes normalized goal event from PSD events array", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => rawDetailWithGoal,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events).toHaveLength(1);
      expect(result.right.events![0]?.type).toBe("goal");
      expect(result.right.events![0]?.minute).toBe(23);
      expect(result.right.events![0]?.team).toBe("home");
      expect(result.right.events![0]?.player).toBe("De Smet");
      expect(result.right.events![0]?.id).toBe(10);
    }
  });

  it("assigns team='away' when clubId matches awayClub", async () => {
    const awayGoal = {
      ...rawDetailWithGoal,
      events: [
        {
          action: { type: "GOAL", subtype: null, id: 11 },
          minute: 60,
          playerId: 77,
          playerName: "Jansen",
          clubId: 200,
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => awayGoal,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events![0]?.team).toBe("away");
    }
  });

  it("marks isPenalty=true for penalty goal", async () => {
    const penaltyGoal = {
      ...rawDetailWithGoal,
      events: [
        {
          action: { type: "GOAL", subtype: "penalty", id: 12 },
          minute: 45,
          playerName: "Martens",
          clubId: 100,
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => penaltyGoal,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events![0]?.isPenalty).toBe(true);
      expect(result.right.events![0]?.isOwnGoal).toBe(false);
    }
  });

  it("marks isOwnGoal=true for own goal", async () => {
    const ownGoal = {
      ...rawDetailWithGoal,
      events: [
        {
          action: { type: "GOAL", subtype: "own_goal", id: 13 },
          minute: 72,
          playerName: "Pieters",
          clubId: 200,
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ownGoal,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events![0]?.isOwnGoal).toBe(true);
      expect(result.right.events![0]?.isPenalty).toBe(false);
    }
  });

  it("transforms yellow card event", async () => {
    const yellowCard = {
      ...rawDetailWithGoal,
      events: [
        {
          action: { type: "CARD", subtype: "yellow", id: 20 },
          minute: 35,
          playerName: "Claes",
          clubId: 100,
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => yellowCard,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events![0]?.type).toBe("yellow_card");
      expect(result.right.events![0]?.minute).toBe(35);
      expect(result.right.events![0]?.player).toBe("Claes");
    }
  });

  it("transforms red card event (direct red)", async () => {
    const redCard = {
      ...rawDetailWithGoal,
      events: [
        {
          action: { type: "CARD", subtype: "red", id: 21 },
          minute: 80,
          playerName: "Dubois",
          clubId: 200,
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => redCard,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events![0]?.type).toBe("red_card");
      expect(result.right.events![0]?.team).toBe("away");
    }
  });

  it("transforms double-yellow (tweede geel) as red_card", async () => {
    const doubleYellow = {
      ...rawDetailWithGoal,
      events: [
        {
          action: { type: "CARD", subtype: "tweedegeel", id: 22 },
          minute: 88,
          playerName: "Vermeersch",
          clubId: 100,
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => doubleYellow,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events![0]?.type).toBe("red_card");
    }
  });

  it("transforms substitution event with playerOut", async () => {
    const substitution = {
      ...rawDetailWithGoal,
      events: [
        {
          action: { type: "SUBSTITUTION", subtype: null, id: 30 },
          minute: 65,
          playerName: "Goossens",
          clubId: 100,
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => substitution,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events![0]?.type).toBe("substitution");
      expect(result.right.events![0]?.playerOut).toBe("Goossens");
      expect(result.right.events![0]?.minute).toBe(65);
    }
  });

  it("skips events with unknown action type", async () => {
    const unknownEvent = {
      ...rawDetailWithGoal,
      events: [
        {
          action: { type: "UNKNOWN_ACTION", subtype: null, id: 99 },
          minute: 50,
          playerName: "Mystery",
          clubId: 100,
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => unknownEvent,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events).toBeUndefined();
    }
  });

  it("returns undefined events when PSD provides no events", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => rawDetailResponse,
    });

    const result = await runService((svc) => svc.getMatchDetail(99));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events).toBeUndefined();
    }
  });

  it("validates MatchDetail with events against api-contract schema", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => rawDetailWithGoal,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(() =>
        S.decodeUnknownSync(MatchDetail)(result.right),
      ).not.toThrow();
    }
  });
});

describe("PsdService.getMatchDetail - resilient decoding", () => {
  it("filters out invalid lineup players and passes valid ones through", async () => {
    const responseWithBadLineup = {
      general: rawDetailResponse.general,
      lineup: {
        home: [
          { playerName: "De Smet", number: 9, status: "basis" }, // valid
          { number: 10, status: "basis" }, // invalid — missing required playerName
        ],
        away: [],
      },
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithBadLineup,
    });

    const result = await runService((svc) => svc.getMatchDetail(99));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.lineup?.home).toHaveLength(1);
      expect(result.right.lineup?.home[0]?.name).toBe("De Smet");
    }
  });

  it("filters out invalid events and passes valid ones through", async () => {
    const responseWithBadEvent = {
      ...rawDetailWithGoal,
      events: [
        {
          action: { type: "GOAL", subtype: null, id: 10 },
          minute: 23,
          playerId: 55,
          playerName: "De Smet",
          clubId: 100,
        }, // valid
        { minute: 40, playerName: "Unknown" }, // invalid — missing required action field
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithBadEvent,
    });

    const result = await runService((svc) => svc.getMatchDetail(123));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.events).toHaveLength(1);
      expect(result.right.events![0]?.type).toBe("goal");
    }
  });
});

describe("PsdService.getPlayerStats", () => {
  const psdPlayerStatsResponse = {
    playerStatistics: [
      {
        gamesPlayed: 15,
        gamesWon: 10,
        gamesEqual: 3,
        gamesLost: 2,
        goals: 8,
        assists: 4,
        yellowCards: 2,
        redCards: 0,
        minutes: 1200,
        team: "KCVV Elewijt A",
      },
    ],
    gameReports: [],
    goals: [],
  };

  it("returns normalized PlayerSeasonStats from PSD response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => psdPlayerStatsResponse,
      });

    const result = await runService((svc) => svc.getPlayerStats(42));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.memberId).toBe(42);
      expect(result.right.teams).toHaveLength(1);
      expect(result.right.teams[0]?.team).toBe("KCVV Elewijt A");
      expect(result.right.teams[0]?.gamesPlayed).toBe(15);
      expect(result.right.teams[0]?.goals).toBe(8);
      expect(result.right.teams[0]?.assists).toBe(4);
      expect(result.right.teams[0]?.minutes).toBe(1200);
    }
  });

  it("formats season dates as ddMMyyyy in PSD API URL", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => psdPlayerStatsResponse,
      });

    await runService((svc) => svc.getPlayerStats(42));

    const secondCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
    const url = secondCall?.[0] as string;
    expect(url).toContain("/statistics/player/42/from/");
    // Verify ddMMyyyy format (8 digits)
    const dateMatch = url.match(/\/from\/(\d{8})\/to\/(\d{8})/);
    expect(dateMatch).not.toBeNull();
  });

  it("returns empty teams when playerStatistics is empty", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ playerStatistics: [] }),
      });

    const result = await runService((svc) => svc.getPlayerStats(42));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.memberId).toBe(42);
      expect(result.right.teams).toHaveLength(0);
    }
  });

  it("handles null team name gracefully", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          playerStatistics: [
            {
              ...psdPlayerStatsResponse.playerStatistics[0],
              team: null,
            },
          ],
        }),
      });

    const result = await runService((svc) => svc.getPlayerStats(42));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.teams[0]?.team).toBe("Unknown");
    }
  });

  it("propagates 404 as ResourceNotFoundError", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

    const result = await runService((svc) => svc.getPlayerStats(99999));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });
});
