import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import { FootbalistoService, FootbalistoServiceLive } from "./service";
import { OpponentHistory } from "@kcvv/api-contract";
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

const sanityClientMock: SanityWriteClientInterface = {
  upsertPlayer: () => Effect.succeed(undefined),
  upsertTeam: () => Effect.succeed(undefined),
  upsertStaff: () => Effect.succeed(undefined),
  getPlayersImageState: () => Effect.succeed(new Map()),
  getActivePlayerPsdIds: () => Effect.succeed([]),
  archivePlayers: () => Effect.succeed(undefined),
  getActiveStaffPsdIds: () => Effect.succeed([]),
  archiveStaff: () => Effect.succeed(undefined),
  getActiveTeamPsdIds: () => Effect.succeed([]),
  archiveTeams: () => Effect.succeed(undefined),
  uploadPlayerImage: () => Effect.succeed(undefined),
  writeFeedback: () => Effect.succeed(undefined),
  getVisibleTeamPsdIds: () => Effect.succeed([]),
};

function runService<A>(
  fn: (
    svc: (typeof FootbalistoService)["Service"],
  ) => Effect.Effect<A, BffError>,
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
        Effect.provide(Layer.succeed(SanityWriteClient, sanityClientMock)),
      ),
    ),
  );
}

const allSeasons = [
  {
    id: 1,
    name: "2023-2024",
    start: "2023-08-01T00:00:00Z",
    end: "2024-06-30T23:59:59Z",
  },
  {
    id: 2,
    name: "2024-2025",
    start: "2024-08-01T00:00:00Z",
    end: "2025-06-30T23:59:59Z",
  },
];

// Season 1: KCVV (teamId=1) is home, wins 2-1 against club 456
const season1Matches = {
  content: [
    {
      id: 101,
      status: 0,
      date: "2024-01-15 00:00",
      time: "15:00",
      homeClub: { id: 100, name: "KCVV Elewijt", logo: "https://cdn/100.png" },
      awayClub: { id: 456, name: "Opponent FC", logo: "https://cdn/456.png" },
      homeTeamId: 1,
      awayTeamId: 99,
      goalsHomeTeam: 2,
      goalsAwayTeam: 1,
      competitionType: { id: 1, name: "3de Nationale", type: "LEAGUE" },
    },
  ],
};

// Season 2: KCVV (teamId=1) is away, loses 0-3 against club 456
const season2Matches = {
  content: [
    {
      id: 201,
      status: 0,
      date: "2024-10-20 00:00",
      time: "15:00",
      homeClub: { id: 456, name: "Opponent FC", logo: "https://cdn/456.png" },
      awayClub: { id: 100, name: "KCVV Elewijt", logo: "https://cdn/100.png" },
      homeTeamId: 99,
      awayTeamId: 1,
      goalsHomeTeam: 3,
      goalsAwayTeam: 0,
      competitionType: { id: 2, name: "3de Nationale", type: "LEAGUE" },
    },
    // A match against a different club — must be filtered out
    {
      id: 202,
      status: 0,
      date: "2024-11-05 00:00",
      time: "15:00",
      homeClub: { id: 100, name: "KCVV Elewijt", logo: "https://cdn/100.png" },
      awayClub: { id: 789, name: "Other Club", logo: null },
      homeTeamId: 1,
      awayTeamId: 88,
      goalsHomeTeam: 1,
      goalsAwayTeam: 1,
      competitionType: { id: 2, name: "3de Nationale", type: "LEAGUE" },
    },
  ],
};

describe("FootbalistoService.getOpponentHistory", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it("returns opponent info, W/D/L summary and filtered sorted matches across all seasons", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => allSeasons })
      .mockResolvedValueOnce({ ok: true, json: async () => season1Matches })
      .mockResolvedValueOnce({ ok: true, json: async () => season2Matches })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: "KCVV Elewijt",
            age: "A",
            gender: "mannen",
            footbelId: null,
            active: true,
          },
        ],
      });

    const result = await runService((svc) => svc.getOpponentHistory(1, 456));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      const history = result.right;

      // Opponent info
      expect(history.opponent.id).toBe(456);
      expect(history.opponent.name).toBe("Opponent FC");

      // Summary: season1=WIN(2-1), season2=LOSS(0-3). Match 202 filtered out.
      expect(history.summary.wins).toBe(1);
      expect(history.summary.draws).toBe(0);
      expect(history.summary.losses).toBe(1);
      expect(history.summary.goalsFor).toBe(2); // 2 (home win) + 0 (away loss)
      expect(history.summary.goalsAgainst).toBe(4); // 1 + 3

      // Only 2 matches against club 456, sorted descending by date
      expect(history.matches).toHaveLength(2);
      expect(history.matches[0]!.id).toBe(201); // 2024-10-20 comes after 2024-01-15
      expect(history.matches[1]!.id).toBe(101);

      // is_home set correctly
      expect(history.matches[0]!.is_home).toBe(false); // KCVV away in match 201
      expect(history.matches[1]!.is_home).toBe(true); // KCVV home in match 101

      // kcvv_team_label derived from the /teams mock: name "KCVV Elewijt", age "A" → "A-Ploeg"
      expect(history.matches[0]!.kcvv_team_label).toBe("A-Ploeg");
      expect(history.matches[1]!.kcvv_team_label).toBe("A-Ploeg");

      // Schema validation
      expect(() => S.decodeUnknownSync(OpponentHistory)(history)).not.toThrow();
    }
  });

  it("returns only scheduled (0 goals) matches without counting them in W/D/L", async () => {
    const scheduledMatch = {
      content: [
        {
          id: 301,
          status: 0,
          date: "2099-05-01 00:00",
          time: "15:00",
          homeClub: { id: 100, name: "KCVV Elewijt", logo: null },
          awayClub: { id: 456, name: "Opponent FC", logo: null },
          homeTeamId: 1,
          awayTeamId: 99,
          goalsHomeTeam: null,
          goalsAwayTeam: null,
          competitionType: { id: 1, name: "3de Nationale", type: "LEAGUE" },
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [allSeasons[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => scheduledMatch })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: "KCVV Elewijt",
            age: "A",
            gender: "mannen",
            footbelId: null,
            active: true,
          },
        ],
      });

    const result = await runService((svc) => svc.getOpponentHistory(1, 456));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.matches).toHaveLength(1);
      // No finished matches → all zero
      expect(result.right.summary.wins).toBe(0);
      expect(result.right.summary.draws).toBe(0);
      expect(result.right.summary.losses).toBe(0);
      expect(result.right.summary.goalsFor).toBe(0);
      expect(result.right.summary.goalsAgainst).toBe(0);
    }
  });

  it("fails with ResourceNotFoundError when no matches found against the club", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [allSeasons[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: "KCVV Elewijt",
            age: "A",
            gender: "mannen",
            footbelId: null,
            active: true,
          },
        ],
      });

    const result = await runService((svc) => svc.getOpponentHistory(1, 456));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });

  it("fails with UpstreamUnavailableError when seasons fetch fails", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const result = await runService((svc) => svc.getOpponentHistory(1, 456));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
      expect((result.left as UpstreamUnavailableError).status).toBe(503);
    }
  });

  it("still returns opponent history when /teams fetch fails (best-effort fallback)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => [allSeasons[0]] })
      .mockResolvedValueOnce({ ok: true, json: async () => season1Matches })
      // /teams fails
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

    const result = await runService((svc) => svc.getOpponentHistory(1, 456));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      // History is returned despite the /teams failure
      expect(result.right.matches).toHaveLength(1);
      expect(result.right.matches[0]!.id).toBe(101);
      // kcvv_team_label is undefined — best-effort failed gracefully
      expect(result.right.matches[0]!.kcvv_team_label).toBeUndefined();
    }
  });

  it("fails with UpstreamUnavailableError when some seasons fail and no opponent matches are found", async () => {
    // Season 1 fails, season 2 succeeds but has no matches against club 456
    const noOpponentMatches = {
      content: [
        {
          id: 999,
          status: 0,
          date: "2024-03-01 00:00",
          time: "15:00",
          homeClub: { id: 100, name: "KCVV Elewijt", logo: null },
          awayClub: { id: 789, name: "Other Club", logo: null },
          homeTeamId: 1,
          awayTeamId: 88,
          goalsHomeTeam: null,
          goalsAwayTeam: null,
          competitionType: { id: 1, name: "3de Nationale", type: "LEAGUE" },
        },
      ],
    };
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => allSeasons })
      // Season 1 fails
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
      })
      // Season 2 succeeds but no matches against club 456
      .mockResolvedValueOnce({ ok: true, json: async () => noOpponentMatches });

    const result = await runService((svc) => svc.getOpponentHistory(1, 456));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
      expect((result.left as UpstreamUnavailableError).status).toBe(503);
    }
  });

  it("skips failed season fetches and continues with available seasons", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => allSeasons })
      // Season 1 fails
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Error" })
      // Season 2 succeeds
      .mockResolvedValueOnce({ ok: true, json: async () => season2Matches })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: "KCVV Elewijt",
            age: "A",
            gender: "mannen",
            footbelId: null,
            active: true,
          },
        ],
      });

    const result = await runService((svc) => svc.getOpponentHistory(1, 456));

    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      // Only match 201 (from season 2) against club 456
      expect(result.right.matches).toHaveLength(1);
      expect(result.right.matches[0]!.id).toBe(201);
      expect(result.right.summary.wins).toBe(0);
      expect(result.right.summary.losses).toBe(1);
    }
  });
});
