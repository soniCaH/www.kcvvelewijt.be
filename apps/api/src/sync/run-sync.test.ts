import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import { runSync } from "./psd-sanity-sync";
import type { SanityWriteClientInterface } from "../sanity/client";
import { SanityWriteClient, SanityWriteError } from "../sanity/client";
import type { PsdTeamClientInterface } from "./psd-team-client";
import { PsdTeamClient } from "./psd-team-client";
import { WorkerEnvTag } from "../env";
import type { PsdMember, PsdTeam } from "@kcvv/api-contract";

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

function makeSanityWriteClientMock() {
  const upsertPlayer = vi.fn(() => Effect.succeed(undefined as void));
  const upsertTeam = vi.fn(() => Effect.succeed(undefined as void));
  const upsertStaff = vi.fn(() => Effect.succeed(undefined as void));
  const uploadPlayerImage = vi.fn(() => Effect.succeed(undefined as void));
  const getPlayersImageState = vi.fn(() =>
    Effect.succeed(
      new Map<string, { psdImageUrl: string | null; hasPsdImage: boolean }>(),
    ),
  );

  const mock: SanityWriteClientInterface = {
    upsertPlayer,
    upsertTeam,
    upsertStaff,
    uploadPlayerImage,
    getPlayersImageState,
  };

  return {
    upsertPlayer,
    upsertTeam,
    upsertStaff,
    uploadPlayerImage,
    getPlayersImageState,
    mock,
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
  sanityMock: SanityWriteClientInterface,
  psdMock: PsdTeamClientInterface,
) {
  return Layer.mergeAll(
    Layer.succeed(SanityWriteClient, sanityMock),
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
      mock: sanityMock,
    } = makeSanityWriteClientMock();
    const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER]);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(Layer.succeed(SanityWriteClient, sanityMock)),
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
      const { mock: sanityMock } = makeSanityWriteClientMock();
      await Effect.runPromise(
        runSync.pipe(
          Effect.provide(buildTestLayer(kvStub, sanityMock, psdMock)),
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

    const {
      upsertPlayer,
      upsertTeam,
      upsertStaff,
      mock: sanityMock,
    } = makeSanityWriteClientMock();
    const psdMock = makePsdTeamClientMock(
      [ONE_TEAM],
      mixedMembers,
      staffFromApi,
    );

    await Effect.runPromise(
      runSync.pipe(Effect.provide(buildTestLayer(kvStub, sanityMock, psdMock))),
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

    const sanityMock: SanityWriteClientInterface = {
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
      getPlayersImageState: vi.fn(() =>
        Effect.succeed(
          new Map<
            string,
            { psdImageUrl: string | null; hasPsdImage: boolean }
          >(),
        ),
      ),
    };
    const psdMock = makePsdTeamClientMock(
      [ONE_TEAM],
      [ONE_PLAYER],
      [ONE_STAFF],
    );

    await Effect.runPromise(
      runSync.pipe(Effect.provide(buildTestLayer(kvStub, sanityMock, psdMock))),
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
    const {
      upsertPlayer,
      uploadPlayerImage,
      mock: sanityMock,
    } = makeSanityWriteClientMock();
    // Image state: empty map → no existing image → needsUpload = true
    const psdMock = makePsdTeamClientMock([ONE_TEAM], [PLAYER_WITH_IMAGE]);

    await Effect.runPromise(
      runSync.pipe(Effect.provide(buildTestLayer(kvStub, sanityMock, psdMock))),
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
      mock: sanityMock,
    } = makeSanityWriteClientMock();

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
      runSync.pipe(Effect.provide(buildTestLayer(kvStub, sanityMock, psdMock))),
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
      mock: sanityMock,
    } = makeSanityWriteClientMock();

    // Make uploadPlayerImage fail
    uploadPlayerImage.mockReturnValue(
      Effect.fail(
        new SanityWriteError("Sanity asset upload timeout"),
      ) as unknown as Effect.Effect<void>,
    );

    const psdMock = makePsdTeamClientMock([ONE_TEAM], [PLAYER_WITH_IMAGE]);

    await Effect.runPromise(
      runSync.pipe(Effect.provide(buildTestLayer(kvStub, sanityMock, psdMock))),
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
});
