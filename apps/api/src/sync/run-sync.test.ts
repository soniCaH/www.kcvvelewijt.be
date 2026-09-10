import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import { runSync } from "./psd-sanity-sync";
import type { SanityMutationInterface } from "../sanity/mutation";
import { SanityMutation, SanityMutationError } from "../sanity/mutation";
import type { SanityProjectionInterface } from "../sanity/projection";
import { SanityProjection } from "../sanity/projection";
import type { PsdTeamClientInterface } from "./psd-team-client";
import { PsdTeamClient, PsdTeamClientError } from "./psd-team-client";
import { WorkerEnvTag } from "../env";
import type {
  PsdClubStaffMember,
  PsdMember,
  PsdTeam,
} from "../psd/schemas-player-team";

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
  // Write methods (SanityMutation)
  const upsertPlayer = vi.fn(() => Effect.succeed(undefined as void));
  const upsertTeam = vi.fn(() => Effect.succeed(undefined as void));
  const upsertStaff = vi.fn(() => Effect.succeed(undefined as void));
  const uploadPlayerImage = vi.fn(() => Effect.succeed(undefined as void));
  const uploadStaffImage = vi.fn(() => Effect.succeed(undefined as void));
  const archivePlayers = vi.fn(() => Effect.succeed(undefined as void));
  const archiveStaff = vi.fn(() => Effect.succeed(undefined as void));
  const archiveTeams = vi.fn(() => Effect.succeed(undefined as void));
  const writeFeedback = vi.fn(() => Effect.succeed(undefined as void));
  const writeMembershipApplication = vi.fn(() =>
    Effect.succeed(undefined as void),
  );

  // Read methods (SanityProjection)
  const getPlayersImageState = vi.fn(() =>
    Effect.succeed(
      new Map<string, { psdImageUrl: string | null; hasPsdImage: boolean }>(),
    ),
  );
  const getStaffImageState = vi.fn(() =>
    Effect.succeed(
      new Map<string, { psdImageUrl: string | null; hasPsdImage: boolean }>(),
    ),
  );
  const getActivePlayerPsdIds = vi.fn(() => Effect.succeed([] as string[]));
  const getActiveStaffPsdIds = vi.fn(() => Effect.succeed([] as string[]));
  const getActiveTeamPsdIds = vi.fn(() => Effect.succeed([] as string[]));
  const getVisibleTeamPsdIds = vi.fn(() => Effect.succeed([] as string[]));
  const getProtectedStaffPsdIds = vi.fn(() => Effect.succeed([] as string[]));
  const getFormRoutingConfig = vi.fn(() => Effect.succeed(null));

  const writerMock: SanityMutationInterface = {
    upsertPlayer,
    upsertTeam,
    upsertStaff,
    uploadPlayerImage,
    uploadStaffImage,
    archivePlayers,
    archiveStaff,
    archiveTeams,
    writeFeedback,
    writeMembershipApplication,
  };

  const readerMock: SanityProjectionInterface = {
    getPlayersImageState,
    getStaffImageState,
    getActivePlayerPsdIds,
    getActiveStaffPsdIds,
    getActiveTeamPsdIds,
    getVisibleTeamPsdIds,
    getProtectedStaffPsdIds,
    getFormRoutingConfig,
  };

  return {
    upsertPlayer,
    upsertTeam,
    upsertStaff,
    uploadPlayerImage,
    uploadStaffImage,
    archivePlayers,
    archiveStaff,
    archiveTeams,
    getPlayersImageState,
    getStaffImageState,
    getActivePlayerPsdIds,
    getActiveStaffPsdIds,
    getActiveTeamPsdIds,
    getProtectedStaffPsdIds,
    writerMock,
    readerMock,
  };
}

function makePsdTeamClientMock(
  teams: readonly PsdTeam[],
  members: readonly PsdMember[],
  staff: readonly PsdMember[] = [],
  clubStaff: readonly PsdClubStaffMember[] = [],
) {
  const mock: PsdTeamClientInterface = {
    getRawTeams: () => Effect.succeed(teams),
    getRawMembers: () => Effect.succeed(members),
    getRawStaff: () => Effect.succeed(staff),
    getRawClubStaff: () => Effect.succeed(clubStaff),
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
    PSD_GATE: {} as DurableObjectNamespace,
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

const STAFF_WITH_IMAGE: PsdMember = {
  id: 8002,
  firstName: "Mieke",
  lastName: "Fotograaf",
  birthDate: "1978-03-20 00:00",
  nationality: "Belgium",
  profilePictureURL: "/images/staff/8002.jpg?v=2&profileAccessKey=def456",
  keeper: false,
  bestPosition: null,
  active: true,
  status: "staff",
  functionTitle: "T2",
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
  writerMock: SanityMutationInterface,
  readerMock: SanityProjectionInterface,
  psdMock: PsdTeamClientInterface,
) {
  return Layer.mergeAll(
    Layer.succeed(SanityMutation, writerMock),
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
        Effect.provide(Layer.succeed(SanityMutation, writerMock)),
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

    const writerMock: SanityMutationInterface = {
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
      uploadStaffImage: vi.fn(() => Effect.succeed(undefined as void)),
      archivePlayers: vi.fn(() => Effect.succeed(undefined as void)),
      archiveStaff: vi.fn(() => Effect.succeed(undefined as void)),
      archiveTeams: vi.fn(() => Effect.succeed(undefined as void)),
      writeFeedback: vi.fn(() => Effect.succeed(undefined as void)),
      writeMembershipApplication: vi.fn(() =>
        Effect.succeed(undefined as void),
      ),
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
      getStaffImageState: vi.fn(() =>
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
      getProtectedStaffPsdIds: vi.fn(() => Effect.succeed([] as string[])),
      getFormRoutingConfig: vi.fn(() => Effect.succeed(null)),
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
        new SanityMutationError("Sanity asset upload timeout"),
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

  // ─── Staff image sync (#2895) — mirrors the player-image tests above ──────

  it("calls uploadStaffImage when profilePictureURL is present and needsUpload is true", async () => {
    const kvStub = makeKvStub();
    const { upsertStaff, uploadStaffImage, writerMock, readerMock } =
      makeSanityMocks();
    // Image state: empty map → no existing image → needsUpload = true
    const psdMock = makePsdTeamClientMock([ONE_TEAM], [], [STAFF_WITH_IMAGE]);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(upsertStaff).toHaveBeenCalledOnce();
    expect(uploadStaffImage).toHaveBeenCalledOnce();
    // First arg = psdId, second = fetch URL (with auth), third = stable URL (without auth)
    expect(uploadStaffImage).toHaveBeenCalledWith(
      "8002",
      expect.stringContaining("profileAccessKey=def456"),
      expect.stringContaining("?v=2"),
    );
  });

  it("skips uploadStaffImage when image is already up-to-date", async () => {
    const kvStub = makeKvStub();
    const {
      upsertStaff,
      uploadStaffImage,
      getStaffImageState,
      writerMock,
      readerMock,
    } = makeSanityMocks();

    // The stable URL that transformStaff will produce for STAFF_WITH_IMAGE
    const expectedStableUrl =
      "https://kcvv.prosoccerdata.com/images/staff/8002.jpg?v=2";

    // Pre-populate image state: already has image with same stable URL
    getStaffImageState.mockReturnValue(
      Effect.succeed(
        new Map([
          ["8002", { psdImageUrl: expectedStableUrl, hasPsdImage: true }],
        ]),
      ),
    );

    const psdMock = makePsdTeamClientMock([ONE_TEAM], [], [STAFF_WITH_IMAGE]);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(upsertStaff).toHaveBeenCalledOnce();
    // Image already up-to-date — should NOT upload
    expect(uploadStaffImage).not.toHaveBeenCalled();
  });

  it("still upserts staff and advances cursor when uploadStaffImage fails (429 etc. — non-fatal)", async () => {
    const kvStub = makeKvStub();
    const {
      upsertStaff,
      upsertTeam,
      uploadStaffImage,
      writerMock,
      readerMock,
    } = makeSanityMocks();

    // Make uploadStaffImage fail, e.g. a 429 from the Sanity asset endpoint
    uploadStaffImage.mockReturnValue(
      Effect.fail(
        new SanityMutationError("Sanity asset upload rate limited (429)"),
      ) as unknown as Effect.Effect<void>,
    );

    const psdMock = makePsdTeamClientMock([ONE_TEAM], [], [STAFF_WITH_IMAGE]);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // Staff was still upserted despite image failure
    expect(upsertStaff).toHaveBeenCalledOnce();
    expect(upsertStaff).toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "8002" }),
    );

    // Image upload was attempted
    expect(uploadStaffImage).toHaveBeenCalledOnce();

    // Team was still upserted
    expect(upsertTeam).toHaveBeenCalledOnce();

    // Cursor was written (sync completed, didn't abort on image failure —
    // the failure retries on the next run, same as the player path)
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
      getRawClubStaff: () => Effect.succeed([]),
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

  it("upserts club-wide (team-less) staff at cycle end and protects them from archival", async () => {
    const kvStub = makeKvStub();

    // PSD team endpoint returns 1 staff for the single team.
    const teamStaff: PsdMember[] = [{ ...ONE_STAFF, id: 500 }];

    // Club-wide endpoint returns the team staff PLUS two team-less club
    // functions (board member 9391) — and a nameless system account (id 1).
    const clubStaff: PsdClubStaffMember[] = [
      {
        id: 500,
        firstName: "Piet",
        lastName: "Trainer",
        birthDate: null,
        functionTitle: "Coach",
        status: "staff",
      },
      {
        id: 9391,
        firstName: "Kim",
        lastName: "Bautmans",
        birthDate: null,
        functionTitle: "Club-API",
        status: "staff",
      },
      {
        id: 1,
        firstName: "",
        lastName: "Admin",
        birthDate: null,
        functionTitle: "",
        status: "staff",
      },
    ];

    const {
      getActiveStaffPsdIds,
      upsertStaff,
      uploadStaffImage,
      archiveStaff,
      writerMock,
      readerMock,
    } = makeSanityMocks();

    // Sanity already has the team-less board member 9391 as active. Without the
    // club-wide fetch it would be an orphan (never in any team) and archived.
    getActiveStaffPsdIds.mockReturnValue(Effect.succeed(["500", "9391"]));

    const psdMock = makePsdTeamClientMock(
      [ONE_TEAM],
      [ONE_PLAYER],
      teamStaff,
      clubStaff,
    );

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // 9391 upserted from the club-wide fetch (resurrects archived board members).
    expect(upsertStaff).toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "9391" }),
    );
    // Nameless system account (id 1) is skipped — no junk staffMember doc.
    expect(upsertStaff).not.toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "1" }),
    );
    // Nothing archived: 9391 is now accumulated, so it is not an orphan.
    expect(archiveStaff).not.toHaveBeenCalled();
    // Club-wide staff never get an image upload attempt (#2895 review):
    // PsdClubStaffMember carries no profilePictureURL at all, so the call
    // would only ever log a skip line — it is deliberately not wired here.
    expect(uploadStaffImage).not.toHaveBeenCalled();
  });

  it("skips staff archival when the club-wide staff fetch fails", async () => {
    const kvStub = makeKvStub();

    const { getActiveStaffPsdIds, archiveStaff, writerMock, readerMock } =
      makeSanityMocks();
    // 9391 would look like an orphan, but the failed club-wide fetch means we
    // cannot safely tell — so archival is skipped rather than risking deletion.
    getActiveStaffPsdIds.mockReturnValue(Effect.succeed(["500", "9391"]));

    const psdMock: PsdTeamClientInterface = {
      getRawTeams: () => Effect.succeed([ONE_TEAM]),
      getRawMembers: () => Effect.succeed([ONE_PLAYER]),
      getRawStaff: () => Effect.succeed([{ ...ONE_STAFF, id: 500 }]),
      getRawClubStaff: () =>
        Effect.fail(new PsdTeamClientError("club-wide fetch boom")),
    };

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(archiveStaff).not.toHaveBeenCalled();
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
      getRawClubStaff: () => Effect.succeed([]),
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

  // ─── Reconciliation safety net: organigram/responsibility protection ────────

  it("skips archiving orphan staff referenced by active organigramNode", async () => {
    const kvStub = makeKvStub();

    // PSD returns 4 staff for the single team
    const psdStaff: PsdMember[] = [
      { ...ONE_STAFF, id: 500 },
      { ...ONE_STAFF, id: 600 },
      { ...ONE_STAFF, id: 700 },
      { ...ONE_STAFF, id: 800 },
    ];

    const {
      getActiveStaffPsdIds,
      getProtectedStaffPsdIds,
      archiveStaff,
      writerMock,
      readerMock,
    } = makeSanityMocks();

    // Sanity has 6 active staff — 900 and 950 are orphans (not in PSD)
    getActiveStaffPsdIds.mockReturnValue(
      Effect.succeed(["500", "600", "700", "800", "900", "950"]),
    );
    // Staff 900 is referenced by an active organigramNode → protected
    getProtectedStaffPsdIds.mockReturnValue(Effect.succeed(["900"]));

    const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER], psdStaff);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // Only 950 should be archived — 900 is protected by organigram ref
    expect(archiveStaff).toHaveBeenCalledOnce();
    expect(archiveStaff).toHaveBeenCalledWith(["950"]);
  });

  it("skips archiving orphan staff referenced by active responsibility", async () => {
    const kvStub = makeKvStub();

    // PSD returns 4 staff for the single team
    const psdStaff: PsdMember[] = [
      { ...ONE_STAFF, id: 500 },
      { ...ONE_STAFF, id: 600 },
      { ...ONE_STAFF, id: 700 },
      { ...ONE_STAFF, id: 800 },
    ];

    const {
      getActiveStaffPsdIds,
      getProtectedStaffPsdIds,
      archiveStaff,
      writerMock,
      readerMock,
    } = makeSanityMocks();

    // Sanity has 6 active staff — 900 and 950 are orphans
    getActiveStaffPsdIds.mockReturnValue(
      Effect.succeed(["500", "600", "700", "800", "900", "950"]),
    );
    // Staff 950 is referenced by an active responsibility → protected
    getProtectedStaffPsdIds.mockReturnValue(Effect.succeed(["950"]));

    const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER], psdStaff);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // Only 900 should be archived — 950 is protected by responsibility ref
    expect(archiveStaff).toHaveBeenCalledOnce();
    expect(archiveStaff).toHaveBeenCalledWith(["900"]);
  });

  it("archives orphan staff without organigram or responsibility refs", async () => {
    const kvStub = makeKvStub();

    // PSD returns 4 staff for the single team
    const psdStaff: PsdMember[] = [
      { ...ONE_STAFF, id: 500 },
      { ...ONE_STAFF, id: 600 },
      { ...ONE_STAFF, id: 700 },
      { ...ONE_STAFF, id: 800 },
    ];

    const {
      getActiveStaffPsdIds,
      getProtectedStaffPsdIds,
      archiveStaff,
      writerMock,
      readerMock,
    } = makeSanityMocks();

    // Sanity has 5 active staff — 900 is the orphan (1/5 = 20% < 30%)
    getActiveStaffPsdIds.mockReturnValue(
      Effect.succeed(["500", "600", "700", "800", "900"]),
    );
    // No protected staff — 900 has no organigram or responsibility refs
    getProtectedStaffPsdIds.mockReturnValue(Effect.succeed([]));

    const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER], psdStaff);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // 900 should be archived — no protection
    expect(archiveStaff).toHaveBeenCalledOnce();
    expect(archiveStaff).toHaveBeenCalledWith(["900"]);
  });

  // ─── Team checkpoint / resume (#2900) ───────────────────────────────────
  // A team whose photos all changed cannot finish in one invocation's budget.
  // These tests pin the fix's guarantee: a truncated run resumes past
  // already-committed members instead of re-walking the whole team, and
  // never marks a member "done" it did not actually finish.

  const PLAYER_A: PsdMember = { ...ONE_PLAYER, id: 501 };
  const PLAYER_B: PsdMember = { ...ONE_PLAYER, id: 502 };
  const PLAYER_C: PsdMember = { ...ONE_PLAYER, id: 503 };
  const STAFF_A: PsdMember = { ...ONE_STAFF, id: 601 };
  const STAFF_B: PsdMember = { ...ONE_STAFF, id: 602 };

  describe("team checkpoint / resume (#2900)", () => {
    it("skips players already checkpointed for the current team, but the team doc still references the full roster", async () => {
      const kvStub = makeKvStub();
      await kvStub.put(
        "sync:team-checkpoint",
        JSON.stringify({
          teamId: ONE_TEAM.id,
          donePlayerIds: ["501"],
          doneStaffIds: [],
        }),
      );

      const { upsertPlayer, upsertTeam, writerMock, readerMock } =
        makeSanityMocks();
      const psdMock = makePsdTeamClientMock(
        [ONE_TEAM],
        [PLAYER_A, PLAYER_B, PLAYER_C],
      );

      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(
            buildTestLayer(kvStub, writerMock, readerMock, psdMock),
          ),
        ),
      );

      // Only B and C were (re)processed — A was skipped as already committed.
      expect(upsertPlayer).toHaveBeenCalledTimes(2);
      expect(upsertPlayer).not.toHaveBeenCalledWith(
        expect.objectContaining({ psdId: "501" }),
      );
      expect(upsertPlayer).toHaveBeenCalledWith(
        expect.objectContaining({ psdId: "502" }),
      );
      expect(upsertPlayer).toHaveBeenCalledWith(
        expect.objectContaining({ psdId: "503" }),
      );

      // The team doc references the full roster, including the member
      // committed before this run even started.
      expect(upsertTeam).toHaveBeenCalledWith(
        expect.objectContaining({ playerPsdIds: ["501", "502", "503"] }),
      );
    });

    it("ignores a checkpoint that names a different team (stale from a previous rotation)", async () => {
      const kvStub = makeKvStub();
      await kvStub.put(
        "sync:team-checkpoint",
        JSON.stringify({
          teamId: 999,
          donePlayerIds: ["501"],
          doneStaffIds: [],
        }),
      );

      const { upsertPlayer, writerMock, readerMock } = makeSanityMocks();
      const psdMock = makePsdTeamClientMock([ONE_TEAM], [PLAYER_A]);

      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(
            buildTestLayer(kvStub, writerMock, readerMock, psdMock),
          ),
        ),
      );

      // A checkpoint for a different team must never suppress this team's
      // own players.
      expect(upsertPlayer).toHaveBeenCalledWith(
        expect.objectContaining({ psdId: "501" }),
      );
    });

    it("checkpoints incrementally: a mid-team failure leaves only the completed member marked done, and the cursor unadvanced", async () => {
      const kvStub = makeKvStub();
      const { upsertPlayer, writerMock, readerMock } = makeSanityMocks();
      upsertPlayer
        .mockImplementationOnce(() => Effect.succeed(undefined as void)) // player A (501) commits
        .mockImplementationOnce(
          () =>
            Effect.fail(
              new SanityMutationError("boom"),
            ) as unknown as Effect.Effect<void>,
        ); // player B (502) fails mid-team

      const psdMock = makePsdTeamClientMock(
        [ONE_TEAM],
        [PLAYER_A, PLAYER_B, PLAYER_C],
      );

      await expect(
        Effect.runPromise(
          runSync.pipe(
            Effect.provide(
              buildTestLayer(kvStub, writerMock, readerMock, psdMock),
            ),
          ),
        ),
      ).rejects.toBeDefined();

      // Only player A — fully committed before the failure — is checkpointed.
      const checkpointRaw = await kvStub.get("sync:team-checkpoint");
      expect(checkpointRaw).not.toBeNull();
      expect(JSON.parse(checkpointRaw!)).toEqual({
        teamId: ONE_TEAM.id,
        donePlayerIds: ["501"],
        doneStaffIds: [],
      });

      // Player B (the one that failed) was still attempted. Whether player C
      // is reached at all depends on fiber scheduling under `concurrency: 2`
      // — a freed slot can start it before B's failure interrupts the loop —
      // so it is deliberately not asserted. The checkpoint above is what
      // proves bounded re-work: nothing past the failure point is marked done.
      expect(upsertPlayer).toHaveBeenCalledWith(
        expect.objectContaining({ psdId: "502" }),
      );

      // The cursor never advances on a failed run.
      expect(await kvStub.get("sync:team-cursor")).toBeNull();
    });

    it("a resumed run after that failure completes the team, clears the checkpoint, and advances the cursor", async () => {
      const kvStub = makeKvStub();
      // The state the failed run above would have left behind.
      await kvStub.put(
        "sync:team-checkpoint",
        JSON.stringify({
          teamId: ONE_TEAM.id,
          donePlayerIds: ["501"],
          doneStaffIds: [],
        }),
      );

      const { upsertPlayer, upsertTeam, writerMock, readerMock } =
        makeSanityMocks();
      // This time every player succeeds.
      const psdMock = makePsdTeamClientMock(
        [ONE_TEAM],
        [PLAYER_A, PLAYER_B, PLAYER_C],
      );

      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(
            buildTestLayer(kvStub, writerMock, readerMock, psdMock),
          ),
        ),
      );

      // Only the bounded remainder (B, C) was re-walked — not A.
      expect(upsertPlayer).toHaveBeenCalledTimes(2);
      expect(upsertPlayer).not.toHaveBeenCalledWith(
        expect.objectContaining({ psdId: "501" }),
      );

      expect(upsertTeam).toHaveBeenCalledWith(
        expect.objectContaining({ playerPsdIds: ["501", "502", "503"] }),
      );

      // The team fully completed: checkpoint cleared, cursor advanced
      // (1 team → wraps back to 0).
      expect(await kvStub.get("sync:team-checkpoint")).toBeNull();
      expect(await kvStub.get("sync:team-cursor")).toBe("0");
    });

    it("mirrors the same checkpoint/resume behaviour for staff", async () => {
      const kvStub = makeKvStub();
      await kvStub.put(
        "sync:team-checkpoint",
        JSON.stringify({
          teamId: ONE_TEAM.id,
          donePlayerIds: [],
          doneStaffIds: ["601"],
        }),
      );

      const { upsertStaff, upsertTeam, writerMock, readerMock } =
        makeSanityMocks();
      const psdMock = makePsdTeamClientMock(
        [ONE_TEAM],
        [ONE_PLAYER],
        [STAFF_A, STAFF_B],
      );

      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(
            buildTestLayer(kvStub, writerMock, readerMock, psdMock),
          ),
        ),
      );

      expect(upsertStaff).toHaveBeenCalledTimes(1);
      expect(upsertStaff).toHaveBeenCalledWith(
        expect.objectContaining({ psdId: "602" }),
      );
      expect(upsertTeam).toHaveBeenCalledWith(
        expect.objectContaining({ staffPsdIds: ["601", "602"] }),
      );
    });

    it("treats a shape-invalid stored checkpoint the same as no checkpoint (#2900 review)", async () => {
      const kvStub = makeKvStub();
      // donePlayerIds is not an array — JSON.parse succeeds, the shape does not.
      await kvStub.put(
        "sync:team-checkpoint",
        JSON.stringify({
          teamId: ONE_TEAM.id,
          donePlayerIds: "not-an-array",
          doneStaffIds: [],
        }),
      );

      const { upsertPlayer, writerMock, readerMock } = makeSanityMocks();
      const psdMock = makePsdTeamClientMock(
        [ONE_TEAM],
        [PLAYER_A, PLAYER_B, PLAYER_C],
      );

      // Must not throw — a shape-invalid checkpoint degrades to "start fresh".
      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(
            buildTestLayer(kvStub, writerMock, readerMock, psdMock),
          ),
        ),
      );

      expect(upsertPlayer).toHaveBeenCalledTimes(3);
    });

    it("does not checkpoint a member whose image upload failed (#2900 review) — it must retry on the next run, not wait a full rotation", async () => {
      const kvStub = makeKvStub();
      const { upsertPlayer, uploadPlayerImage, writerMock, readerMock } =
        makeSanityMocks();
      uploadPlayerImage.mockReturnValue(
        Effect.fail(
          new SanityMutationError("rate limited (429)"),
        ) as unknown as Effect.Effect<void>,
      );

      const psdMock = makePsdTeamClientMock([ONE_TEAM], [PLAYER_WITH_IMAGE]);

      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(
            buildTestLayer(kvStub, writerMock, readerMock, psdMock),
          ),
        ),
      );

      // The player doc still committed (existing behaviour)...
      expect(upsertPlayer).toHaveBeenCalledOnce();
      // ...but every checkpoint snapshot written along the way excluded this
      // member, since its image never actually landed.
      const checkpointWrites = (
        kvStub.put as ReturnType<typeof vi.fn>
      ).mock.calls
        .filter(([key]) => key === "sync:team-checkpoint")
        .map(([, value]) => JSON.parse(value as string) as TeamCheckpointShape);
      for (const snapshot of checkpointWrites) {
        expect(snapshot.donePlayerIds).not.toContain("7001");
      }
    });

    it("debounces checkpoint writes instead of one per member (#2900 review — KV allows at most 1 write/s/key)", async () => {
      const kvStub = makeKvStub();
      const { writerMock, readerMock } = makeSanityMocks();
      const PLAYER_D: PsdMember = { ...ONE_PLAYER, id: 504 };
      const psdMock = makePsdTeamClientMock(
        [ONE_TEAM],
        [PLAYER_A, PLAYER_B, PLAYER_C, PLAYER_D],
      );

      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(
            buildTestLayer(kvStub, writerMock, readerMock, psdMock),
          ),
        ),
      );

      // 4 members complete near-instantly in this test — one checkpoint PUT
      // per member (the pre-review design) would be 4. Debounced to ~1.1s,
      // only the first member's write (the debounce window always starts
      // open) and the forced final flush should actually land.
      const checkpointWrites = (
        kvStub.put as ReturnType<typeof vi.fn>
      ).mock.calls.filter(([key]) => key === "sync:team-checkpoint");
      expect(checkpointWrites.length).toBeLessThan(4);
      expect(checkpointWrites.length).toBeGreaterThan(0);
    });
  });
});

interface TeamCheckpointShape {
  teamId: number;
  donePlayerIds: string[];
  doneStaffIds: string[];
}
