import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer, Logger, Schema as S } from "effect";
import {
  FootbalistoService,
  FootbalistoServiceLive,
  mapGameStatus,
  mapCompetitionLabel,
} from "./service";
import { Match, MatchDetail, RankingEntry } from "@kcvv/api-contract";
import { UpstreamUnavailableError, type BffError } from "./errors";
import { WorkerEnvTag } from "../env";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import {
  SanityWriteClient,
  type SanityWriteClientInterface,
} from "../sanity/client";

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
): SanityWriteClientInterface {
  return {
    upsertPlayer: () => Effect.succeed(undefined as void),
    upsertTeam: () => Effect.succeed(undefined as void),
    upsertStaff: () => Effect.succeed(undefined as void),
    uploadPlayerImage: () => Effect.succeed(undefined as void),
    getPlayersImageState: () => Effect.succeed(new Map()),
    getActivePlayerPsdIds: () => Effect.succeed([]),
    archivePlayers: () => Effect.succeed(undefined as void),
    getActiveStaffPsdIds: () => Effect.succeed([]),
    archiveStaff: () => Effect.succeed(undefined as void),
    getActiveTeamPsdIds: () => Effect.succeed([]),
    archiveTeams: () => Effect.succeed(undefined as void),
    writeFeedback: () => Effect.succeed(undefined as void),
    getVisibleTeamPsdIds: () => Effect.succeed(visiblePsdIds),
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
  fn: (
    svc: (typeof FootbalistoService)["Service"],
  ) => Effect.Effect<A, BffError>,
  options: {
    sanityMock?: SanityWriteClientInterface;
    kvMock?: KvCacheInterface;
  } = {},
) {
  const sanity = options.sanityMock ?? makeSanityMock();
  const kv = options.kvMock ?? cacheMock;
  const program = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* fn(service);
  });
  return Effect.runPromise(
    Effect.either(
      program.pipe(
        Effect.provide(FootbalistoServiceLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, kv)),
        Effect.provide(Layer.succeed(SanityWriteClient, sanity)),
      ),
    ),
  );
}

describe("FootbalistoService.getTeamMatches", () => {
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

describe("FootbalistoService.getNextMatches", () => {
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
    const spySanityMock: SanityWriteClientInterface = {
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

describe("FootbalistoService.getMatchById", () => {
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

describe("FootbalistoService.getRanking", () => {
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
        const svc = yield* FootbalistoService;
        return yield* svc.getRanking(1, "https://cdn.example.com");
      }).pipe(
        Effect.provide(FootbalistoServiceLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
        Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
      ),
    );

    expect(
      messages.some((m) => m.includes("filtered") && m.includes("1")),
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

describe("FootbalistoService.getMatchDetail", () => {
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

describe("mapGameStatus", () => {
  it("returns an Effect that resolves to the correct status", async () => {
    const result = await Effect.runPromise(mapGameStatus(0, 3, 1));
    expect(result).toBe("finished");
  });

  it("returns 'scheduled' for status 0 with no goals", async () => {
    const result = await Effect.runPromise(mapGameStatus(0, null, null));
    expect(result).toBe("scheduled");
  });

  it("returns 'forfeited' for status 1", async () => {
    const result = await Effect.runPromise(mapGameStatus(1, null, null));
    expect(result).toBe("forfeited");
  });

  it("returns 'postponed' for status 2", async () => {
    const result = await Effect.runPromise(mapGameStatus(2, null, null));
    expect(result).toBe("postponed");
  });

  it("returns 'stopped' for status 3", async () => {
    const result = await Effect.runPromise(mapGameStatus(3, null, null));
    expect(result).toBe("stopped");
  });

  it("returns 'postponed' when cancelled regardless of status", async () => {
    const result = await Effect.runPromise(mapGameStatus(0, 3, 1, true));
    expect(result).toBe("postponed");
  });

  it("logs a warning for unknown status code", async () => {
    const messages: string[] = [];
    const TestLogger = Logger.make(({ message }) => {
      messages.push(String(message));
    });

    const result = await Effect.runPromise(
      mapGameStatus(99, null, null).pipe(
        Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
      ),
    );

    expect(result).toBe("scheduled");
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("Unknown PSD game status code: 99");
  });

  it("logs a warning for unknown status code when cancelled", async () => {
    const messages: string[] = [];
    const TestLogger = Logger.make(({ message }) => {
      messages.push(String(message));
    });

    const result = await Effect.runPromise(
      mapGameStatus(99, null, null, true).pipe(
        Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
      ),
    );

    expect(result).toBe("postponed");
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("Unknown PSD game status code: 99");
  });
});

describe("mapCompetitionLabel", () => {
  it("maps LEAGUE to 'Competitie'", () => {
    expect(mapCompetitionLabel("LEAGUE", "3de Nationale")).toBe("Competitie");
  });

  it("maps CUP to the PSD name when available", () => {
    expect(mapCompetitionLabel("CUP", "Beker van Brabant")).toBe(
      "Beker van Brabant",
    );
  });

  it("maps CUP to 'Beker' when name is null", () => {
    expect(mapCompetitionLabel("CUP", null)).toBe("Beker");
  });

  it("maps FRIENDLY to 'Vriendschappelijk'", () => {
    expect(mapCompetitionLabel("FRIENDLY", null)).toBe("Vriendschappelijk");
  });

  it("falls back to raw type for unknown types", () => {
    expect(mapCompetitionLabel("INTERLAND", null)).toBe("INTERLAND");
  });
});
