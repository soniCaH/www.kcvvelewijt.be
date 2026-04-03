import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import { runSync } from "./psd-sanity-sync";
import type { SanityWriteClientInterface } from "../sanity/client";
import { SanityWriteClient, SanityWriteError } from "../sanity/client";
import type { SanityProjectionInterface } from "../sanity/projection";
import { SanityProjection } from "../sanity/projection";
import type { PsdTeamClientInterface } from "./psd-team-client";
import { PsdTeamClient } from "./psd-team-client";
import { WorkerEnvTag } from "../env";
import type { PsdMember, PsdTeam } from "../psd/schemas-player-team";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ONE_TEAM: PsdTeam = {
  id: 42,
  name: "Eerste Elftal A",
  age: "A",
  gender: "mannen",
  footbelId: 183904,
  active: true,
};

const ONE_PLAYER: PsdMember = {
  id: 6453,
  firstName: "Alexander",
  lastName: "Bell",
  birthDate: "1993-11-29 00:00",
  nationality: "Belgium",
  profilePictureURL: null, // no image — tracer bullet
  keeper: false,
  bestPosition: null,
  active: true,
  status: "speler",
  functionTitle: null,
};

// ─── Mock factories ──────────────────────────────────────────────────────────

function makeSanityMocks() {
  // Write methods (SanityWriteClient)
  const upsertPlayer = vi.fn(() => Effect.succeed(undefined as void));
  const upsertTeam = vi.fn(() => Effect.succeed(undefined as void));
  const upsertStaff = vi.fn(() => Effect.succeed(undefined as void));
  const uploadPlayerImage = vi.fn(() => Effect.succeed(undefined as void));
  const archivePlayers = vi.fn(() => Effect.succeed(undefined as void));
  const archiveStaff = vi.fn(() => Effect.succeed(undefined as void));
  const archiveTeams = vi.fn(() => Effect.succeed(undefined as void));
  const writeFeedback = vi.fn(() => Effect.succeed(undefined as void));

  // Read methods (SanityProjection)
  const getPlayersImageState = vi.fn(() =>
    Effect.succeed(
      new Map<string, { psdImageUrl: string | null; hasPsdImage: boolean }>(),
    ),
  );
  const getActivePlayerPsdIds = vi.fn(() => Effect.succeed([] as string[]));
  const getActiveStaffPsdIds = vi.fn(() => Effect.succeed([] as string[]));
  const getActiveTeamPsdIds = vi.fn(() => Effect.succeed([] as string[]));
  const getVisibleTeamPsdIds = vi.fn(() => Effect.succeed([] as string[]));

  const writerMock: SanityWriteClientInterface = {
    upsertPlayer,
    upsertTeam,
    upsertStaff,
    uploadPlayerImage,
    archivePlayers,
    archiveStaff,
    archiveTeams,
    writeFeedback,
  };

  const readerMock: SanityProjectionInterface = {
    getPlayersImageState,
    getActivePlayerPsdIds,
    getActiveStaffPsdIds,
    getActiveTeamPsdIds,
    getVisibleTeamPsdIds,
  };

  return {
    upsertPlayer,
    upsertTeam,
    upsertStaff,
    uploadPlayerImage,
    archivePlayers,
    archiveStaff,
    archiveTeams,
    getPlayersImageState,
    getActivePlayerPsdIds,
    getActiveStaffPsdIds,
    getActiveTeamPsdIds,
    writerMock,
    readerMock,
  };
}

function makePsdTeamClientMock(
  teams: readonly PsdTeam[],
  members: readonly PsdMember[],
  staff: readonly PsdMember[] = [],
) {
  const mock: PsdTeamClientInterface = {
    getRawTeams: () => Effect.succeed(teams),
    getRawMembers: () => Effect.succeed(members),
    getRawStaff: () => Effect.succeed(staff),
  };
  return mock;
}

function makeKvStub() {
  const store = new Map<string, string>();
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    put: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    delete: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    store,
  } as unknown as KVNamespace;
}

function makeEnvLayer(kvStub: KVNamespace) {
  return Layer.succeed(WorkerEnvTag, {
    PSD_API_BASE_URL: "https://clubapi.prosoccerdata.com",
    PSD_IMAGE_BASE_URL: "https://kcvv.prosoccerdata.com",
    FOOTBALISTO_LOGO_CDN_URL: "https://cdn.example.com",
    PSD_API_KEY: "test-key",
    PSD_API_CLUB: "test-club",
    PSD_API_AUTH: "test-auth",
    PSD_CACHE: kvStub,
    SANITY_PROJECT_ID: "test",
    SANITY_DATASET: "test",
    SANITY_API_TOKEN: "test-token",
    SANITY_WEBHOOK_SECRET: "",
    AI: {} as Ai,
    SEARCH_INDEX: {} as VectorizeIndex,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

// ─── Additional fixtures ─────────────────────────────────────────────────────

const THREE_TEAMS: PsdTeam[] = [
  {
    id: 1,
    name: "Team A",
    age: "A",
    gender: "mannen",
    footbelId: 100,
    active: true,
  },
  {
    id: 2,
    name: "Team B",
    age: "U21",
    gender: "mannen",
    footbelId: 200,
    active: true,
  },
  {
    id: 3,
    name: "Team C",
    age: "U17",
    gender: "mannen",
    footbelId: 300,
    active: true,
  },
];

const PLAYER_WITH_IMAGE: PsdMember = {
  id: 7001,
  firstName: "Jan",
  lastName: "Foto",
  birthDate: "1995-05-15 00:00",
  nationality: "Belgium",
  profilePictureURL: "/images/player/7001.jpg?v=2&profileAccessKey=abc123",
  keeper: false,
  bestPosition: null,
  active: true,
  status: "speler",
  functionTitle: null,
};

const ONE_STAFF: PsdMember = {
  id: 8001,
  firstName: "Piet",
  lastName: "Trainer",
  birthDate: "1980-01-01 00:00",
  nationality: "Belgium",
  profilePictureURL: null,
  keeper: false,
  bestPosition: null,
  active: true,
  status: "staff",
  functionTitle: "Coach",
};

const UNKNOWN_STATUS_MEMBER: PsdMember = {
  id: 9001,
  firstName: "Onbekend",
  lastName: "Lid",
  birthDate: "2000-06-01 00:00",
  nationality: "Belgium",
  profilePictureURL: null,
  keeper: false,
  bestPosition: null,
  active: true,
  status: "bestuurslid" as PsdMember["status"],
  functionTitle: null,
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function buildTestLayer(
  kvStub: KVNamespace,
  writerMock: SanityWriteClientInterface,
  readerMock: SanityProjectionInterface,
  psdMock: PsdTeamClientInterface,
) {
  return Layer.mergeAll(
    Layer.succeed(SanityWriteClient, writerMock),
    Layer.succeed(SanityProjection, readerMock),
    Layer.succeed(PsdTeamClient, psdMock),
    makeEnvLayer(kvStub),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("runSync", () => {
  it("upserts 1 player and 1 team, skips staff, when given 1 team with 1 player", async () => {
    const kvStub = makeKvStub();
    const {
      upsertPlayer,
      upsertTeam,
      upsertStaff,
      uploadPlayerImage,
      writerMock,
      readerMock,
    } = makeSanityMocks();
    const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER]);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(Layer.succeed(SanityWriteClient, writerMock)),
        Effect.provide(Layer.succeed(SanityProjection, readerMock)),
        Effect.provide(Layer.succeed(PsdTeamClient, psdMock)),
        Effect.provide(makeEnvLayer(kvStub)),
      ),
    );

    // upsertPlayer called once with psdId "6453"
    expect(upsertPlayer).toHaveBeenCalledOnce();
    expect(upsertPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "6453" }),
    );

    // upsertTeam called once with psdId "42"
    expect(upsertTeam).toHaveBeenCalledOnce();
    expect(upsertTeam).toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "42" }),
    );

    // upsertStaff not called (no staff members)
    expect(upsertStaff).not.toHaveBeenCalled();

    // uploadPlayerImage not called (profilePictureURL is null)
    expect(uploadPlayerImage).not.toHaveBeenCalled();
  });

  it("cursor wraps back to 0 after processing all 3 teams", async () => {
    const kvStub = makeKvStub();
    const psdMock = makePsdTeamClientMock(THREE_TEAMS, [ONE_PLAYER]);

    // Run sync 3 times — each run processes one team, cursor advances
    for (let i = 0; i < 3; i++) {
      const { writerMock, readerMock } = makeSanityMocks();
      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(
            buildTestLayer(kvStub, writerMock, readerMock, psdMock),
          ),
        ),
      );
    }

    // After 3 runs with 3 teams, cursor should wrap back to 0
    const finalCursor = await kvStub.get("sync:team-cursor");
    expect(finalCursor).toBe("0");
  });

  it("routes players to upsertPlayer, staff to upsertStaff, and skips unknown statuses", async () => {
    const kvStub = makeKvStub();
    // getRawMembers returns mixed statuses — partitionMembers extracts only "speler"
    const mixedMembers: PsdMember[] = [ONE_PLAYER, UNKNOWN_STATUS_MEMBER];
    // getRawStaff is a separate PSD endpoint — its results go directly to upsertStaff
    const staffFromApi: PsdMember[] = [ONE_STAFF];

    const { upsertPlayer, upsertTeam, upsertStaff, writerMock, readerMock } =
      makeSanityMocks();
    const psdMock = makePsdTeamClientMock(
      [ONE_TEAM],
      mixedMembers,
      staffFromApi,
    );

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // Only "speler" from getRawMembers → upsertPlayer
    expect(upsertPlayer).toHaveBeenCalledOnce();
    expect(upsertPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "6453" }),
    );

    // Staff from getRawStaff → upsertStaff
    expect(upsertStaff).toHaveBeenCalledOnce();
    expect(upsertStaff).toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "8001" }),
    );

    // Unknown status member (bestuurslid) is neither upserted as player nor staff.
    // Since upsertPlayer was calledOnce with psdId "6453" and upsertStaff with "8001",
    // member 9001 was correctly skipped.

    // Team still upserted with correct references
    expect(upsertTeam).toHaveBeenCalledOnce();
    expect(upsertTeam).toHaveBeenCalledWith(
      expect.objectContaining({
        playerPsdIds: ["6453"], // only the player, not unknown
        staffPsdIds: ["8001"],
      }),
    );
  });

  it("calls upsertTeam only after all players and staff are upserted", async () => {
    const kvStub = makeKvStub();
    const callOrder: string[] = [];

    const writerMock: SanityWriteClientInterface = {
      upsertPlayer: vi.fn(() => {
        callOrder.push("upsertPlayer");
        return Effect.succeed(undefined as void);
      }),
      upsertTeam: vi.fn(() => {
        callOrder.push("upsertTeam");
        return Effect.succeed(undefined as void);
      }),
      upsertStaff: vi.fn(() => {
        callOrder.push("upsertStaff");
        return Effect.succeed(undefined as void);
      }),
      uploadPlayerImage: vi.fn(() => Effect.succeed(undefined as void)),
      archivePlayers: vi.fn(() => Effect.succeed(undefined as void)),
      archiveStaff: vi.fn(() => Effect.succeed(undefined as void)),
      archiveTeams: vi.fn(() => Effect.succeed(undefined as void)),
      writeFeedback: vi.fn(() => Effect.succeed(undefined as void)),
    };
    const readerMock: SanityProjectionInterface = {
      getPlayersImageState: vi.fn(() =>
        Effect.succeed(
          new Map<
            string,
            { psdImageUrl: string | null; hasPsdImage: boolean }
          >(),
        ),
      ),
      getActivePlayerPsdIds: vi.fn(() => Effect.succeed([] as string[])),
      getActiveStaffPsdIds: vi.fn(() => Effect.succeed([] as string[])),
      getActiveTeamPsdIds: vi.fn(() => Effect.succeed([] as string[])),
      getVisibleTeamPsdIds: vi.fn(() => Effect.succeed([] as string[])),
    };
    const psdMock = makePsdTeamClientMock(
      [ONE_TEAM],
      [ONE_PLAYER],
      [ONE_STAFF],
    );

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // upsertTeam must be the last upsert call (after all players and staff)
    const teamIdx = callOrder.lastIndexOf("upsertTeam");
    const lastPlayerIdx = callOrder.lastIndexOf("upsertPlayer");
    const lastStaffIdx = callOrder.lastIndexOf("upsertStaff");

    expect(teamIdx).toBeGreaterThan(lastPlayerIdx);
    expect(teamIdx).toBeGreaterThan(lastStaffIdx);
  });

  it("calls uploadPlayerImage when profilePictureURL is present and needsUpload is true", async () => {
    const kvStub = makeKvStub();
    const { upsertPlayer, uploadPlayerImage, writerMock, readerMock } =
      makeSanityMocks();
    // Image state: empty map → no existing image → needsUpload = true
    const psdMock = makePsdTeamClientMock([ONE_TEAM], [PLAYER_WITH_IMAGE]);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(upsertPlayer).toHaveBeenCalledOnce();
    expect(uploadPlayerImage).toHaveBeenCalledOnce();
    // First arg = psdId, second = fetch URL (with auth), third = stable URL (without auth)
    expect(uploadPlayerImage).toHaveBeenCalledWith(
      "7001",
      expect.stringContaining("profileAccessKey=abc123"),
      expect.stringContaining("?v=2"),
    );
  });

  it("skips uploadPlayerImage when image is already up-to-date", async () => {
    const kvStub = makeKvStub();
    const {
      upsertPlayer,
      uploadPlayerImage,
      getPlayersImageState,
      writerMock,
      readerMock,
    } = makeSanityMocks();

    // The stable URL that transformMember will produce for PLAYER_WITH_IMAGE
    const expectedStableUrl =
      "https://kcvv.prosoccerdata.com/images/player/7001.jpg?v=2";

    // Pre-populate image state: already has image with same stable URL
    getPlayersImageState.mockReturnValue(
      Effect.succeed(
        new Map([
          ["7001", { psdImageUrl: expectedStableUrl, hasPsdImage: true }],
        ]),
      ),
    );

    const psdMock = makePsdTeamClientMock([ONE_TEAM], [PLAYER_WITH_IMAGE]);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(upsertPlayer).toHaveBeenCalledOnce();
    // Image already up-to-date — should NOT upload
    expect(uploadPlayerImage).not.toHaveBeenCalled();
  });

  it("still upserts player and advances cursor when uploadPlayerImage fails", async () => {
    const kvStub = makeKvStub();
    const {
      upsertPlayer,
      upsertTeam,
      uploadPlayerImage,
      writerMock,
      readerMock,
    } = makeSanityMocks();

    // Make uploadPlayerImage fail
    uploadPlayerImage.mockReturnValue(
      Effect.fail(
        new SanityWriteError("Sanity asset upload timeout"),
      ) as unknown as Effect.Effect<void>,
    );

    const psdMock = makePsdTeamClientMock([ONE_TEAM], [PLAYER_WITH_IMAGE]);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // Player was still upserted despite image failure
    expect(upsertPlayer).toHaveBeenCalledOnce();
    expect(upsertPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "7001" }),
    );

    // Image upload was attempted
    expect(uploadPlayerImage).toHaveBeenCalledOnce();

    // Team was still upserted
    expect(upsertTeam).toHaveBeenCalledOnce();

    // Cursor was written (sync completed, didn't abort on image failure)
    // With 1 team: nextCursor = (0 + 1) % 1 = 0
    const kvPut = kvStub.put as ReturnType<typeof vi.fn>;
    expect(kvPut).toHaveBeenCalledWith("sync:team-cursor", "0");
  });

  it("archives orphan player when cycle completes (5 in Sanity, 4 in PSD)", async () => {
    const kvStub = makeKvStub();

    // PSD returns 4 players for the single team
    const psdPlayers: PsdMember[] = [
      { ...ONE_PLAYER, id: 100 },
      { ...ONE_PLAYER, id: 200 },
      { ...ONE_PLAYER, id: 300 },
      { ...ONE_PLAYER, id: 400 },
    ];

    const { getActivePlayerPsdIds, archivePlayers, writerMock, readerMock } =
      makeSanityMocks();

    // Sanity has 5 active players — player 500 is the orphan (1/5 = 20% < 30%)
    getActivePlayerPsdIds.mockReturnValue(
      Effect.succeed(["100", "200", "300", "400", "500"]),
    );

    const psdMock = makePsdTeamClientMock([ONE_TEAM], psdPlayers);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // With 1 team, cursor wraps to 0 immediately → reconciliation runs
    expect(archivePlayers).toHaveBeenCalledOnce();
    expect(archivePlayers).toHaveBeenCalledWith(["500"]);
  });

  it("does not reconcile mid-cycle (cursor not at 0)", async () => {
    const kvStub = makeKvStub();

    const TWO_TEAMS: PsdTeam[] = [
      { ...ONE_TEAM, id: 1, name: "Team A" },
      { ...ONE_TEAM, id: 2, name: "Team B" },
    ];

    const { archivePlayers, writerMock, readerMock } = makeSanityMocks();
    const psdMock = makePsdTeamClientMock(TWO_TEAMS, [ONE_PLAYER]);

    // Run 1: processes Team A (cursor 0 → 1), not at end of cycle
    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(archivePlayers).not.toHaveBeenCalled();
  });

  it("accumulates player IDs across teams and reconciles at cycle end", async () => {
    const kvStub = makeKvStub();

    const TWO_TEAMS: PsdTeam[] = [
      { ...ONE_TEAM, id: 1, name: "Team A" },
      { ...ONE_TEAM, id: 2, name: "Team B" },
    ];

    // Team A has players 100, 200. Team B has players 200, 300.
    const psdMock: PsdTeamClientInterface = {
      getRawTeams: () => Effect.succeed(TWO_TEAMS),
      getRawMembers: (teamId) =>
        Effect.succeed(
          teamId === 1
            ? [
                { ...ONE_PLAYER, id: 100 },
                { ...ONE_PLAYER, id: 200 },
              ]
            : [
                { ...ONE_PLAYER, id: 200 },
                { ...ONE_PLAYER, id: 300 },
              ],
        ),
      getRawStaff: () => Effect.succeed([]),
    };

    // Run 1: processes Team A (cursor 0 → 1)
    const s1 = makeSanityMocks();
    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(
          buildTestLayer(kvStub, s1.writerMock, s1.readerMock, psdMock),
        ),
      ),
    );
    expect(s1.archivePlayers).not.toHaveBeenCalled();

    // Run 2: processes Team B (cursor 1 → 0, cycle complete)
    const s2 = makeSanityMocks();
    // Sanity has 4 active players — player 400 is the orphan
    s2.getActivePlayerPsdIds.mockReturnValue(
      Effect.succeed(["100", "200", "300", "400"]),
    );

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(
          buildTestLayer(kvStub, s2.writerMock, s2.readerMock, psdMock),
        ),
      ),
    );

    // Reconciliation should archive player 400
    expect(s2.archivePlayers).toHaveBeenCalledOnce();
    expect(s2.archivePlayers).toHaveBeenCalledWith(["400"]);

    // KV accumulation key should be cleared after reconciliation
    const accumulatedIds = await kvStub.get("sync:cycle-player-ids");
    expect(accumulatedIds).toBeNull();
  });

  it("archives orphan staff when cycle completes (5 in Sanity, 4 in PSD)", async () => {
    const kvStub = makeKvStub();

    // PSD returns 4 staff members for the single team
    const psdStaff: PsdMember[] = [
      { ...ONE_STAFF, id: 500 },
      { ...ONE_STAFF, id: 600 },
      { ...ONE_STAFF, id: 700 },
      { ...ONE_STAFF, id: 800 },
    ];

    const { getActiveStaffPsdIds, archiveStaff, writerMock, readerMock } =
      makeSanityMocks();

    // Sanity has 5 active staff — staff 900 is the orphan (1/5 = 20% < 30%)
    getActiveStaffPsdIds.mockReturnValue(
      Effect.succeed(["500", "600", "700", "800", "900"]),
    );

    const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER], psdStaff);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // With 1 team, cursor wraps to 0 immediately → reconciliation runs
    expect(archiveStaff).toHaveBeenCalledOnce();
    expect(archiveStaff).toHaveBeenCalledWith(["900"]);
  });

  it("archives orphan team when cycle completes (team disappears from PSD)", async () => {
    const kvStub = makeKvStub();

    // 4 teams in PSD — gives us enough active teams so 1 orphan = 20% < 30%
    const FOUR_TEAMS: PsdTeam[] = [
      { ...ONE_TEAM, id: 42, name: "Team A" },
      { ...ONE_TEAM, id: 43, name: "Team B" },
      { ...ONE_TEAM, id: 44, name: "Team C" },
      { ...ONE_TEAM, id: 45, name: "Team D" },
    ];

    const { getActiveTeamPsdIds, archiveTeams, writerMock, readerMock } =
      makeSanityMocks();

    // Sanity has 5 active teams — team 77 is the orphan (1/5 = 20% < 30%)
    getActiveTeamPsdIds.mockReturnValue(
      Effect.succeed(["42", "43", "44", "45", "77"]),
    );

    const psdMock = makePsdTeamClientMock(FOUR_TEAMS, [ONE_PLAYER]);

    // Run all 4 teams to complete the cycle
    for (let i = 0; i < 4; i++) {
      const isLastRun = i === 3;
      const current = isLastRun
        ? { writerMock, readerMock }
        : makeSanityMocks();
      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(
            buildTestLayer(
              kvStub,
              current.writerMock,
              current.readerMock,
              psdMock,
            ),
          ),
        ),
      );
    }

    // After 4 runs, cursor wraps to 0 → reconciliation runs
    expect(archiveTeams).toHaveBeenCalledOnce();
    expect(archiveTeams).toHaveBeenCalledWith(["77"]);
  });

  it("accumulates staff IDs across teams and reconciles at cycle end", async () => {
    const kvStub = makeKvStub();

    const TWO_TEAMS: PsdTeam[] = [
      { ...ONE_TEAM, id: 1, name: "Team A" },
      { ...ONE_TEAM, id: 2, name: "Team B" },
    ];

    // Team A has staff 500, 600. Team B has staff 500, 600, 700 (500+600 shared).
    const psdMock: PsdTeamClientInterface = {
      getRawTeams: () => Effect.succeed(TWO_TEAMS),
      getRawMembers: () => Effect.succeed([ONE_PLAYER]),
      getRawStaff: (teamId) =>
        Effect.succeed(
          teamId === 1
            ? [
                { ...ONE_STAFF, id: 500 },
                { ...ONE_STAFF, id: 600 },
              ]
            : [
                { ...ONE_STAFF, id: 500 },
                { ...ONE_STAFF, id: 600 },
                { ...ONE_STAFF, id: 700 },
              ],
        ),
    };

    // Run 1: processes Team A (cursor 0 → 1)
    const s1 = makeSanityMocks();
    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(
          buildTestLayer(kvStub, s1.writerMock, s1.readerMock, psdMock),
        ),
      ),
    );
    expect(s1.archiveStaff).not.toHaveBeenCalled();

    // Run 2: processes Team B (cursor 1 → 0, cycle complete)
    const s2 = makeSanityMocks();
    // Sanity has 4 active staff — staff 800 is the orphan (1/4 = 25% < 30%)
    s2.getActiveStaffPsdIds.mockReturnValue(
      Effect.succeed(["500", "600", "700", "800"]),
    );

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(
          buildTestLayer(kvStub, s2.writerMock, s2.readerMock, psdMock),
        ),
      ),
    );

    // Reconciliation should archive staff 800
    expect(s2.archiveStaff).toHaveBeenCalledOnce();
    expect(s2.archiveStaff).toHaveBeenCalledWith(["800"]);

    // KV accumulation key should be cleared after reconciliation
    const accumulatedStaffIds = await kvStub.get("sync:cycle-staff-ids");
    expect(accumulatedStaffIds).toBeNull();
  });

  it("skips archival when orphan ratio exceeds safety threshold (production incident regression)", async () => {
    const kvStub = makeKvStub();

    // PSD returns only 1 team with 1 player and 1 staff
    const psdMock = makePsdTeamClientMock(
      [ONE_TEAM],
      [ONE_PLAYER],
      [ONE_STAFF],
    );

    const {
      getActivePlayerPsdIds,
      archivePlayers,
      getActiveStaffPsdIds,
      archiveStaff,
      getActiveTeamPsdIds,
      archiveTeams,
      writerMock,
      readerMock,
    } = makeSanityMocks();

    // Sanity has 5 active players but PSD only returned 1 → 4 orphans (80% > 30%)
    getActivePlayerPsdIds.mockReturnValue(
      Effect.succeed(["6453", "200", "300", "400", "500"]),
    );
    // Sanity has 5 active staff but PSD only returned 1 → 4 orphans (80% > 30%)
    getActiveStaffPsdIds.mockReturnValue(
      Effect.succeed(["8001", "600", "700", "800", "900"]),
    );
    // Sanity has 5 active teams but PSD only returned 1 → 4 orphans (80% > 30%)
    getActiveTeamPsdIds.mockReturnValue(
      Effect.succeed(["42", "43", "44", "45", "46"]),
    );

    // With 1 team, cursor wraps to 0 immediately → reconciliation runs
    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // Safety threshold should prevent all three archive calls
    expect(archivePlayers).not.toHaveBeenCalled();
    expect(archiveStaff).not.toHaveBeenCalled();
    expect(archiveTeams).not.toHaveBeenCalled();
  });

  it("does not reconcile staff or teams mid-cycle", async () => {
    const kvStub = makeKvStub();

    const TWO_TEAMS: PsdTeam[] = [
      { ...ONE_TEAM, id: 1, name: "Team A" },
      { ...ONE_TEAM, id: 2, name: "Team B" },
    ];

    const { archiveStaff, archiveTeams, writerMock, readerMock } =
      makeSanityMocks();
    const psdMock = makePsdTeamClientMock(TWO_TEAMS, [ONE_PLAYER], [ONE_STAFF]);

    // Run 1: processes Team A (cursor 0 → 1), not at end of cycle
    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(archiveStaff).not.toHaveBeenCalled();
    expect(archiveTeams).not.toHaveBeenCalled();
  });
});
