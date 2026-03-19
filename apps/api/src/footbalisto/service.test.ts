import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import {
  FootbalistoService,
  FootbalistoServiceError,
  FootbalistoServiceLive,
} from "./service";
import { WorkerEnvTag } from "../env";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";

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
    AI: {} as Ai,
    SEARCH_INDEX: {} as VectorizeIndex,
  });
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
};

const seasons = [
  {
    id: 42,
    name: "2024-2025",
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];

const rawStats = {
  squadPlayerStatistics: [
    {
      playerId: 1,
      firstName: "Test",
      lastName: "Player",
      team: "KCVV Elewijt A",
      gamesPlayed: 25,
      gamesWon: 18,
      gamesLost: 3,
      gamesEqual: 4,
      cleanSheets: 8,
      minutes: 2250,
      goals: 2,
      assists: 1,
      yellowCards: 1,
      redCards: 0,
    },
  ],
  goalsScored: [{ goal: { id: 1 } }],
  goalsAgainst: [],
};

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
    competitionType: "3de Nationale",
    viewGameReport: true,
    status: 0,
  },
};

function runService<A>(
  fn: (
    svc: (typeof FootbalistoService)["Service"],
  ) => Effect.Effect<A, FootbalistoServiceError>,
) {
  const program = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* fn(service);
  });
  return Effect.runPromise(
    Effect.either(
      program.pipe(
        Effect.provide(FootbalistoServiceLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    ),
  );
}

function runGetTeamStats(teamId: number) {
  const program = Effect.gen(function* () {
    const service = yield* FootbalistoService;
    return yield* service.getTeamStats(teamId);
  });
  return Effect.runPromise(
    Effect.either(
      program.pipe(
        Effect.provide(FootbalistoServiceLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    ),
  );
}

describe("FootbalistoService", () => {
  it("getTeamStats returns correct TeamStats from mocked HTTP responses", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({ ok: true, json: async () => rawStats });

    const result = await runGetTeamStats(1);

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.team_id).toBe(1);
      expect(result.right.team_name).toBe("KCVV Elewijt A");
      expect(result.right.wins).toBe(18);
    }
  });

  it("getTeamStats fails when fetch rejects (network failure)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const result = await runGetTeamStats(1);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(FootbalistoServiceError);
    }
  });

  it("getTeamStats fails when fetch returns HTTP 500", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await runGetTeamStats(1);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(FootbalistoServiceError);
      expect(result.left.status).toBe(500);
    }
  });

  it("getTeamStats fails when no active season exists", async () => {
    const inactiveSeasons = [
      {
        id: 41,
        name: "2023-2024",
        start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
        end: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
      },
    ];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => inactiveSeasons,
    });

    const result = await runGetTeamStats(1);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(FootbalistoServiceError);
      expect(result.left.message).toBe("No active season found");
    }
  });

  it("getTeamStats fails when stats response fails schema validation", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: "data" }),
      });

    const result = await runGetTeamStats(1);

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(FootbalistoServiceError);
      expect(result.left.message).toBe("Schema validation failed");
    }
  });
});

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
      expect(result.left).toBeInstanceOf(FootbalistoServiceError);
    }
  });
});

describe("FootbalistoService.getNextMatches", () => {
  it("fetches next match per team, filters out teamId 23, returns transformed Matches", async () => {
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
      // /teams list endpoint
      return Promise.resolve({ ok: true, json: async () => rawTeams });
    });

    const result = await runService((svc) => svc.getNextMatches());

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      // Team 23 (Weitse Gans) should be filtered out
      expect(result.right).toHaveLength(1);
      expect(result.right[0]?.id).toBe(102);
      expect(result.right[0]?.status).toBe("scheduled");
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
    }
  });

  it("fails when match detail fetch returns HTTP error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const result = await runService((svc) => svc.getMatchById(99));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(FootbalistoServiceError);
      expect(result.left.status).toBe(404);
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
});

describe("FootbalistoService.getMatchDetail", () => {
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
    }
  });

  it("fails when match detail fetch returns HTTP error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await runService((svc) => svc.getMatchDetail(99));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(FootbalistoServiceError);
      expect(result.left.status).toBe(500);
    }
  });
});
