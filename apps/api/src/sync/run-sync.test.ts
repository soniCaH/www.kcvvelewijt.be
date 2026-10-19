import { describe, it, expect, vi } from "vitest";
import { Effect, Either, Layer, Logger } from "effect";
import { runSync } from "./psd-sanity-sync";
import type { SanityMutationInterface } from "../sanity/mutation";
import { SanityMutation, SanityMutationError } from "../sanity/mutation";
import type { SanityProjectionInterface } from "../sanity/projection";
import { SanityProjection } from "../sanity/projection";
import type { PsdTeamClientInterface } from "./psd-team-client";
import { PsdTeamClient, PsdTeamClientError } from "./psd-team-client";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import { makeSanityProjectionStub } from "../test-helpers/sanity-projection-stub";
import type { WorkerEnv } from "../env";
import {
  KvCacheService,
  KvError,
  type KvCacheInterface,
} from "../cache/kv-cache";
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
  const unsetPlayerImage = vi.fn((_psdId: string) =>
    Effect.succeed(undefined as void),
  );
  const unsetStaffImage = vi.fn((_psdId: string) =>
    Effect.succeed(undefined as void),
  );
  const archivePlayers = vi.fn(() => Effect.succeed(undefined as void));
  const archiveStaff = vi.fn(() => Effect.succeed(undefined as void));
  const archiveTeams = vi.fn(() => Effect.succeed(undefined as void));
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
  const getTeamPlayerPsdIds = vi.fn((_teamPsdId: string) =>
    Effect.succeed([] as string[]),
  );
  const getProtectedStaffPsdIds = vi.fn(() => Effect.succeed([] as string[]));
  const getFormRoutingConfig = vi.fn(() => Effect.succeed(null));

  const writerMock: SanityMutationInterface = {
    upsertPlayer,
    upsertTeam,
    upsertStaff,
    uploadPlayerImage,
    uploadStaffImage,
    unsetPlayerImage,
    unsetStaffImage,
    archivePlayers,
    archiveStaff,
    archiveTeams,
    writeMembershipApplication,
  };

  const readerMock: SanityProjectionInterface = {
    getPlayersImageState,
    getStaffImageState,
    getActivePlayerPsdIds,
    getActiveStaffPsdIds,
    getActiveTeamPsdIds,
    getVisibleTeamPsdIds,
    getTeamPlayerPsdIds,
    getProtectedStaffPsdIds,
    getFormRoutingConfig,
    getStaffGaps: makeSanityProjectionStub().getStaffGaps,
  };

  return {
    upsertPlayer,
    upsertTeam,
    upsertStaff,
    uploadPlayerImage,
    uploadStaffImage,
    unsetPlayerImage,
    unsetStaffImage,
    archivePlayers,
    archiveStaff,
    archiveTeams,
    getPlayersImageState,
    getStaffImageState,
    getActivePlayerPsdIds,
    getActiveStaffPsdIds,
    getActiveTeamPsdIds,
    getTeamPlayerPsdIds,
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

/**
 * A `KvCacheService` test double, not a hand-rolled `KVNamespace` (#2873 AC:
 * `runSync` goes through the port now, so the test should substitute the
 * SERVICE, not fake the raw binding underneath it). `get`/`put`/`delete`
 * stay real `vi.fn`s so every existing assertion in this file — reading the
 * backing `store`, or asserting on `kvStub.put`'s call args — keeps working
 * unchanged: every write `runSync` makes goes through `durable.setForever`
 * (all of its keys are TTL-less, see psd-sanity-sync.ts), which is just
 * `put` under the hood here, same as before this port existed.
 *
 * `get`/`set`/`setForever`/`delete` are wrapped in `Effect.tryPromise`
 * (mapping a rejection to `KvError`), NOT `Effect.promise` — a stub typed
 * `Effect<…, never>` could never express the failure path this port exists
 * to make possible, and a test overriding `get`/`put`/`delete` to reject
 * (see the error-path tests below) would surface as an uncaught defect
 * instead of the `KvError` `runSync` actually has to handle (#2873 review).
 * `set` forwards its `ttl` as `put`'s third argument (mirroring the real
 * `makeDurableKv`'s `{ expirationTtl: ttl }`) so a `set`/`setForever` mix-up
 * at a call site shows up as a 2-arg-vs-3-arg mismatch against this file's
 * existing `toHaveBeenCalledWith("sync:team-cursor", "0")`-style
 * assertions, rather than passing either way.
 */
function makeKvStub() {
  const store = new Map<string, string>();
  const get = vi.fn((key: string) => Promise.resolve(store.get(key) ?? null));
  const put = vi.fn(
    (key: string, value: string, _options?: { expirationTtl: number }) => {
      store.set(key, value);
      return Promise.resolve();
    },
  );
  const del = vi.fn((key: string) => {
    store.delete(key);
    return Promise.resolve();
  });
  const durable = {
    get: (key: string) =>
      Effect.tryPromise({
        try: () => get(key),
        catch: (cause) =>
          new KvError(`KV get failed for "${key}": ${String(cause)}`, cause),
      }),
    set: (key: string, value: string, ttl: number) =>
      Effect.tryPromise({
        try: () => put(key, value, { expirationTtl: ttl }),
        catch: (cause) =>
          new KvError(`KV put failed for "${key}": ${String(cause)}`, cause),
      }),
    setForever: (key: string, value: string) =>
      Effect.tryPromise({
        try: () => put(key, value),
        catch: (cause) =>
          new KvError(`KV put failed for "${key}": ${String(cause)}`, cause),
      }),
    delete: (key: string) =>
      Effect.tryPromise({
        try: () => del(key),
        catch: (cause) =>
          new KvError(`KV delete failed for "${key}": ${String(cause)}`, cause),
      }),
    list: () => Effect.succeed({ keys: [] as string[], complete: true }),
  };
  const cache: KvCacheInterface = {
    get: () => Effect.succeed(null),
    set: () => Effect.succeed(undefined),
    delete: () => Effect.succeed(undefined),
    durable: {
      ...durable,
      forDataset: (dataset: string) => ({ ...durable, dataset }),
    },
  };
  return { get, put, delete: del, store, cache };
}

function makeEnvLayer() {
  return makeTestEnvLayer({
    SANITY_WEBHOOK_SECRET: "",
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
  kvStub: ReturnType<typeof makeKvStub>,
  writerMock: SanityMutationInterface,
  readerMock: SanityProjectionInterface,
  psdMock: PsdTeamClientInterface,
) {
  return Layer.mergeAll(
    Layer.succeed(SanityMutation, writerMock),
    Layer.succeed(SanityProjection, readerMock),
    Layer.succeed(PsdTeamClient, psdMock),
    Layer.succeed(KvCacheService, kvStub.cache),
    makeEnvLayer(),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("runSync", () => {
  it("unsets the stored portrait of a player PSD no longer has a portrait for (#3469)", async () => {
    const kvStub = makeKvStub();
    const { unsetPlayerImage, getPlayersImageState, writerMock, readerMock } =
      makeSanityMocks();
    getPlayersImageState.mockReturnValue(
      Effect.succeed(
        new Map([
          [
            "6453",
            {
              psdImageUrl: "https://kcvv.prosoccerdata.com/old.jpg?v=1",
              hasPsdImage: true,
            },
          ],
        ]),
      ),
    );
    const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER]);

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(unsetPlayerImage).toHaveBeenCalledExactlyOnceWith("6453");
  });

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
        Effect.provide(Layer.succeed(KvCacheService, kvStub.cache)),
        Effect.provide(makeEnvLayer()),
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
      unsetPlayerImage: vi.fn(() => Effect.succeed(undefined as void)),
      unsetStaffImage: vi.fn(() => Effect.succeed(undefined as void)),
      archivePlayers: vi.fn(() => Effect.succeed(undefined as void)),
      archiveStaff: vi.fn(() => Effect.succeed(undefined as void)),
      archiveTeams: vi.fn(() => Effect.succeed(undefined as void)),
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
      getTeamPlayerPsdIds: vi.fn(() => Effect.succeed([] as string[])),
      getProtectedStaffPsdIds: vi.fn(() => Effect.succeed([] as string[])),
      getFormRoutingConfig: vi.fn(() => Effect.succeed(null)),
      getStaffGaps: makeSanityProjectionStub().getStaffGaps,
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

    const { cleanup } = await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // With 1 team, cursor wraps to 0 immediately → reconciliation runs
    expect(archivePlayers).toHaveBeenCalledOnce();
    expect(archivePlayers).toHaveBeenCalledWith(["500"]);
    expect(cleanup).toEqual({ kind: "ok" });
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
    const { cleanup } = await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(archivePlayers).not.toHaveBeenCalled();
    expect(cleanup).toEqual({ kind: "not-run" });
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

  it("never writes a sync-excluded staff member, on either path", async () => {
    const kvStub = makeKvStub();
    // 257 is on SYNC_EXCLUDED_STAFF_PSD_IDS: they keep their PSD login but
    // asked to be removed from the site.
    const teamStaff: PsdMember[] = [ONE_STAFF, { ...ONE_STAFF, id: 257 }];
    const clubStaff: PsdClubStaffMember[] = [
      {
        id: 257,
        firstName: "Excluded",
        lastName: "Member",
        birthDate: null,
        functionTitle: "Bestuurslid",
        status: "staff",
      },
    ];
    const { upsertStaff, upsertTeam, writerMock, readerMock } =
      makeSanityMocks();
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

    expect(upsertStaff).toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "8001" }),
    );
    expect(upsertStaff).not.toHaveBeenCalledWith(
      expect.objectContaining({ psdId: "257" }),
    );
    expect(upsertTeam).toHaveBeenCalledWith(
      expect.objectContaining({ staffPsdIds: ["8001"] }),
    );
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

    const { cleanup } = await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(archiveStaff).not.toHaveBeenCalled();
    expect(cleanup).toEqual({
      kind: "skipped",
      skips: [
        {
          kind: "staff-fetch-failed",
          error: expect.stringContaining("club-wide fetch boom"),
        },
      ],
    });
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
    const { cleanup } = await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // Safety threshold should prevent all three archive calls
    expect(archivePlayers).not.toHaveBeenCalled();
    expect(archiveStaff).not.toHaveBeenCalled();
    expect(archiveTeams).not.toHaveBeenCalled();
    // ... and each refusal reaches the caller with its counts (#3564)
    expect(cleanup).toEqual({
      kind: "skipped",
      skips: ["players", "staff", "teams"].map((entity) => ({
        kind: "orphan-cap",
        entity,
        orphanCount: 4,
        activeCount: 5,
        ratio: 0.8,
      })),
    });
  });

  it("releases a stuck orphan-cap refusal via the sync:orphan-cap-override KV key, then clears it (#2854)", async () => {
    const kvStub = makeKvStub();
    // Set the release lever before this run — mirrors a human running
    // `wrangler kv key put sync:orphan-cap-override 1 --binding=PSD_CACHE`
    // after confirming the delete set is legitimate.
    await kvStub.put("sync:orphan-cap-override", "1");

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

    // Same 80%-orphan shape as the test above, which normally refuses.
    getActivePlayerPsdIds.mockReturnValue(
      Effect.succeed(["6453", "200", "300", "400", "500"]),
    );
    getActiveStaffPsdIds.mockReturnValue(
      Effect.succeed(["8001", "600", "700", "800", "900"]),
    );
    getActiveTeamPsdIds.mockReturnValue(
      Effect.succeed(["42", "43", "44", "45", "46"]),
    );

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // The override bypassed the cap — all three archive calls went through.
    expect(archivePlayers).toHaveBeenCalledWith(["200", "300", "400", "500"]);
    expect(archiveStaff).toHaveBeenCalledWith(["600", "700", "800", "900"]);
    expect(archiveTeams).toHaveBeenCalledWith(["43", "44", "45", "46"]);

    // One-shot: the key is gone after use.
    expect(await kvStub.get("sync:orphan-cap-override")).toBeNull();
  });

  it("scopes the override to one entity type — a players-only value does not bypass staff or teams (#2854 review finding 3)", async () => {
    const kvStub = makeKvStub();
    await kvStub.put("sync:orphan-cap-override", "players");

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

    // Same 80%-orphan shape for all three — only players should bypass.
    getActivePlayerPsdIds.mockReturnValue(
      Effect.succeed(["6453", "200", "300", "400", "500"]),
    );
    getActiveStaffPsdIds.mockReturnValue(
      Effect.succeed(["8001", "600", "700", "800", "900"]),
    );
    getActiveTeamPsdIds.mockReturnValue(
      Effect.succeed(["42", "43", "44", "45", "46"]),
    );

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    // Players bypassed the cap; staff and teams were still refused.
    expect(archivePlayers).toHaveBeenCalledWith(["200", "300", "400", "500"]);
    expect(archiveStaff).not.toHaveBeenCalled();
    expect(archiveTeams).not.toHaveBeenCalled();

    expect(await kvStub.get("sync:orphan-cap-override")).toBeNull();
  });

  it("consumes the override key upfront even when the scoped leg never runs (#2854 review finding 4)", async () => {
    const kvStub = makeKvStub();
    await kvStub.put("sync:orphan-cap-override", "staff");

    // The club-wide staff fetch fails outright — staff reconciliation is
    // skipped entirely, so the staff-scoped bypass is never evaluated.
    const psdMock: PsdTeamClientInterface = {
      getRawTeams: () => Effect.succeed([ONE_TEAM]),
      getRawMembers: () => Effect.succeed([ONE_PLAYER]),
      getRawStaff: () => Effect.succeed([]),
      getRawClubStaff: () =>
        Effect.fail(new PsdTeamClientError("club staff fetch failed")),
    };

    const { archiveStaff, writerMock, readerMock } = makeSanityMocks();

    await Effect.runPromise(
      runSync.pipe(
        Effect.provide(buildTestLayer(kvStub, writerMock, readerMock, psdMock)),
      ),
    );

    expect(archiveStaff).not.toHaveBeenCalled();
    // Consumed on observation, not on confirmed application (documented
    // trade-off in ORPHAN_CAP_OVERRIDE_KEY's doc comment) — the operator
    // must re-arm it if the staff cap still needs releasing.
    expect(await kvStub.get("sync:orphan-cap-override")).toBeNull();
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

  // ─── Durable KV error paths (#2873 review) ───────────────────────────────
  // The `durable` port surfaces KvError instead of swallowing it — these
  // pin that each call site in runSync still does what it always did with
  // a KV failure: some propagate and fail the whole sync, some log and
  // let the run complete. A test double that can never fail (Effect.promise)
  // could not have caught a regression here.

  describe("durable KV error paths (#2873 review)", () => {
    it("fails the sync instead of silently treating a non-array accumulator value as empty — a stray `null` must not orphan every active player", async () => {
      const kvStub = makeKvStub();
      // Simulates a hand-written `wrangler kv key put` (or a future writer)
      // leaving the accumulator holding valid-but-non-array JSON.
      // `JSON.parse` succeeds, and `new Set<string>(null)` would silently
      // yield an empty set rather than throwing — the Array.isArray guard
      // is what turns this into a failure instead of a partial id set.
      kvStub.store.set("sync:cycle-player-ids", "null");

      const { archivePlayers, writerMock, readerMock } = makeSanityMocks();
      const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER]);

      await expect(
        Effect.runPromise(
          runSync.pipe(
            Effect.provide(
              buildTestLayer(kvStub, writerMock, readerMock, psdMock),
            ),
          ),
        ),
      ).rejects.toBeDefined();

      // The sync failed before ever reaching reconciliation — archivePlayers
      // must not have been given a chance to run against a partial id set.
      expect(archivePlayers).not.toHaveBeenCalled();
    });

    it("fails the sync when an accumulator read itself fails (a genuine KV error, not just bad JSON)", async () => {
      const kvStub = makeKvStub();
      const originalGet = kvStub.get.getMockImplementation()!;
      kvStub.get.mockImplementation((key: string) => {
        if (key === "sync:cycle-player-ids") {
          return Promise.reject(new Error("KV outage"));
        }
        return originalGet(key);
      });

      const { archivePlayers, writerMock, readerMock } = makeSanityMocks();
      const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER]);

      await expect(
        Effect.runPromise(
          runSync.pipe(
            Effect.provide(
              buildTestLayer(kvStub, writerMock, readerMock, psdMock),
            ),
          ),
        ),
      ).rejects.toBeDefined();

      expect(archivePlayers).not.toHaveBeenCalled();
    });

    it("does not fail a mid-cycle run when the rotation-cursor write fails — it logs and lets the next run re-read the stored value", async () => {
      const kvStub = makeKvStub();
      const originalPut = kvStub.put.getMockImplementation()!;
      kvStub.put.mockImplementation(
        (key: string, value: string, options?: { expirationTtl: number }) => {
          if (key === "sync:team-cursor") {
            return Promise.reject(new Error("KV outage"));
          }
          return originalPut(key, value, options);
        },
      );

      const { upsertPlayer, upsertTeam, writerMock, readerMock } =
        makeSanityMocks();
      // 3 teams, cursor 0 → team index 0 of 3 is mid-cycle.
      const psdMock = makePsdTeamClientMock(THREE_TEAMS, [ONE_PLAYER]);

      await expect(
        Effect.runPromise(
          runSync.pipe(
            Effect.provide(
              buildTestLayer(kvStub, writerMock, readerMock, psdMock),
            ),
          ),
        ),
      ).resolves.toEqual({ cleanup: { kind: "not-run" } });

      expect(upsertPlayer).toHaveBeenCalledOnce();
      expect(upsertTeam).toHaveBeenCalledOnce();
      // The write was attempted (and failed) — proves the failure path ran.
      expect(kvStub.put).toHaveBeenCalledWith("sync:team-cursor", "1");
    });

    it("fails the run when the cursor write fails at cycle end (#3465) — a swallowed failure there re-runs the last team with cleared accumulators", async () => {
      const kvStub = makeKvStub();
      const originalPut = kvStub.put.getMockImplementation()!;
      kvStub.put.mockImplementation(
        (key: string, value: string, options?: { expirationTtl: number }) => {
          if (key === "sync:team-cursor") {
            return Promise.reject(new Error("KV outage"));
          }
          return originalPut(key, value, options);
        },
      );

      const { upsertTeam, writerMock, readerMock } = makeSanityMocks();
      const psdMock = makePsdTeamClientMock([ONE_TEAM], [ONE_PLAYER]);

      const result = await Effect.runPromise(
        Effect.either(
          runSync.pipe(
            Effect.provide(
              buildTestLayer(kvStub, writerMock, readerMock, psdMock),
            ),
          ),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
      expect(upsertTeam).toHaveBeenCalledOnce();
      expect(kvStub.put).toHaveBeenCalledWith("sync:team-cursor", "0");
    });
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

    it("a mid-team member failure no longer strands the team (#3465): the other members commit, the team is written, the cursor advances, the checkpoint is cleared and the run fails", async () => {
      const kvStub = makeKvStub();
      const { upsertPlayer, upsertTeam, writerMock, readerMock } =
        makeSanityMocks();
      upsertPlayer.mockImplementation(((doc: { psdId: string }) =>
        doc.psdId === "502"
          ? Effect.fail(new SanityMutationError("boom"))
          : Effect.succeed(undefined as void)) as never);

      const psdMock = makePsdTeamClientMock(
        [ONE_TEAM],
        [PLAYER_A, PLAYER_B, PLAYER_C],
      );

      const result = await Effect.runPromise(
        Effect.either(
          runSync.pipe(
            Effect.provide(
              buildTestLayer(kvStub, writerMock, readerMock, psdMock),
            ),
          ),
        ),
      );

      expect(Either.isLeft(result)).toBe(true);
      // 1 team → cursor wraps to 0, written even though the run fails.
      expect(await kvStub.get("sync:team-cursor")).toBe("0");
      // The cursor moved on, so a checkpoint naming this team would be read
      // as "already done" a whole rotation later — it must not survive.
      expect(await kvStub.get("sync:team-checkpoint")).toBeNull();
      expect(upsertPlayer).toHaveBeenCalledTimes(3);
      expect(upsertTeam).toHaveBeenCalledOnce();
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

  // ─── #3465: reordered / shrunk PSD team list ────────────────────────────
  describe("stable team order, cycle-end guard, zero rosters, member isolation, manual runs (#3465)", () => {
    const team = (id: number): PsdTeam => ({
      ...ONE_TEAM,
      id,
      name: `Team ${id}`,
    });
    const player = (id: number): PsdMember => ({ ...ONE_PLAYER, id });
    const staffer = (id: number): PsdMember => ({ ...ONE_STAFF, id });

    /** PSD double whose roster depends on the team asked for. */
    function perTeamPsd(
      teams: readonly PsdTeam[],
      players: Record<number, readonly PsdMember[]>,
      staff: Record<number, readonly PsdMember[]> = {},
    ): PsdTeamClientInterface {
      return {
        getRawTeams: () => Effect.succeed(teams),
        getRawMembers: (id: number) => Effect.succeed(players[id] ?? []),
        getRawStaff: (id: number) => Effect.succeed(staff[id] ?? []),
        getRawClubStaff: () => Effect.succeed([]),
      };
    }

    /** One `runSync` with captured logs; resolves to the Either so failures are assertable. */
    async function once(
      kvStub: ReturnType<typeof makeKvStub>,
      mocks: ReturnType<typeof makeSanityMocks>,
      psdMock: PsdTeamClientInterface,
      env: Partial<WorkerEnv> = {},
    ) {
      const logs: Array<{ level: string; text: string }> = [];
      const capture = Logger.replace(
        Logger.defaultLogger,
        Logger.make(({ logLevel, message }) => {
          const parts: unknown[] = Array.isArray(message) ? message : [message];
          logs.push({ level: logLevel.label, text: parts.join(" ") });
        }),
      );
      const result = await Effect.runPromise(
        Effect.either(
          runSync.pipe(
            Effect.provide(
              Layer.mergeAll(
                Layer.succeed(SanityMutation, mocks.writerMock),
                Layer.succeed(SanityProjection, mocks.readerMock),
                Layer.succeed(PsdTeamClient, psdMock),
                Layer.succeed(KvCacheService, kvStub.cache),
                makeTestEnvLayer({ SANITY_WEBHOOK_SECRET: "", ...env }),
                capture,
              ),
            ),
          ),
        ),
      );
      return { result, logs };
    }

    const idsIn = async (kvStub: ReturnType<typeof makeKvStub>, key: string) =>
      JSON.parse((await kvStub.get(key)) ?? "[]") as string[];

    it("walks teams in numeric id order, whatever order PSD returns them in", async () => {
      const kvStub = makeKvStub();
      const mocks = makeSanityMocks();
      const psd = perTeamPsd([team(30), team(10), team(20)], {});
      await kvStub.put("sync:team-cursor", "1");

      await once(kvStub, mocks, psd);

      expect(mocks.upsertTeam).toHaveBeenCalledOnce();
      expect(mocks.upsertTeam).toHaveBeenCalledWith(
        expect.objectContaining({ psdId: "20" }),
      );
    });

    it("archives no team and no player when PSD removes a team before the cursor mid-cycle", async () => {
      const kvStub = makeKvStub();
      const ids = [1, 2, 3, 4, 5];
      const full = perTeamPsd(
        ids.map(team),
        Object.fromEntries(ids.map((i) => [i, [player(100 + i)]])),
      );
      const shrunk = perTeamPsd(
        ids.slice(1).map(team), // team 1 disappears after it was visited
        Object.fromEntries(ids.map((i) => [i, [player(100 + i)]])),
      );
      const activeTeams = ids.map(String);
      const activePlayers = ids.map((i) => String(100 + i));

      // two nights on the full list (teams 1, 2) ...
      for (const _ of [0, 1]) {
        await once(kvStub, makeSanityMocks(), full);
      }
      // ... then team 1 is removed: the stored cursor 2 now points at team 4
      // (index 2 of [2,3,4,5]) and team 3 is skipped this cycle.
      const last = makeSanityMocks();
      last.getActiveTeamPsdIds.mockReturnValue(Effect.succeed(activeTeams));
      last.getActivePlayerPsdIds.mockReturnValue(Effect.succeed(activePlayers));
      await once(kvStub, last, shrunk); // team 4 (index 2)
      await once(kvStub, last, shrunk); // team 5 (index 3) → cycle end

      expect(last.archiveTeams).not.toHaveBeenCalled();
      expect(last.archivePlayers).not.toHaveBeenCalled();
      expect(last.archiveStaff).not.toHaveBeenCalled();
    });

    it("does not archive a team that is absent from the live list on the cycle-end run but present in the accumulator", async () => {
      const kvStub = makeKvStub();
      await kvStub.put("sync:team-cursor", "2");
      await kvStub.put("sync:cycle-team-ids", JSON.stringify(["1", "2", "3"]));
      const mocks = makeSanityMocks();
      mocks.getActiveTeamPsdIds.mockReturnValue(
        Effect.succeed(["1", "2", "3", "4"]),
      );

      // Live list [2,3,4]: team 1 is gone, cursor 2 is the last index (team 4).
      await once(kvStub, mocks, perTeamPsd([team(2), team(3), team(4)], {}));

      expect(mocks.archiveTeams).not.toHaveBeenCalled();
    });

    it("skips player and staff reconciliation, logs a WARN and still clears the accumulators when a live team is missing from the accumulator", async () => {
      const kvStub = makeKvStub();
      await kvStub.put("sync:team-cursor", "2");
      // Team 2 is live but was never visited this cycle.
      await kvStub.put("sync:cycle-team-ids", JSON.stringify(["1"]));
      await kvStub.put("sync:cycle-player-ids", JSON.stringify(["101"]));
      await kvStub.put("sync:cycle-staff-ids", JSON.stringify([]));
      const mocks = makeSanityMocks();
      mocks.getActivePlayerPsdIds.mockReturnValue(
        Effect.succeed(["101", "102", "103", "104", "105"]),
      );
      mocks.getActiveStaffPsdIds.mockReturnValue(
        Effect.succeed(["601", "602", "603", "604", "605"]),
      );

      const { result, logs } = await once(
        kvStub,
        mocks,
        perTeamPsd([team(1), team(2), team(3)], { 3: [player(103)] }),
      );

      expect(Either.isRight(result)).toBe(true);
      expect(mocks.archivePlayers).not.toHaveBeenCalled();
      expect(mocks.archiveStaff).not.toHaveBeenCalled();
      expect(Either.isRight(result) && result.right.cleanup).toEqual({
        kind: "skipped",
        skips: [{ kind: "cycle-incomplete", missingTeamIds: ["2"] }],
      });
      expect(
        logs.some((l) => l.level === "WARN" && /incomplete/i.test(l.text)),
      ).toBe(true);
      expect(await kvStub.get("sync:cycle-team-ids")).toBeNull();
      expect(await kvStub.get("sync:cycle-player-ids")).toBeNull();
      expect(await kvStub.get("sync:cycle-staff-ids")).toBeNull();
      expect(await kvStub.get("sync:team-cursor")).toBe("0");
    });

    describe("zero roster", () => {
      const MARKER = "sync:empty-roster:1";

      it("holds the team back on the first empty roster: no upsertTeam, ids accumulated, marker written", async () => {
        const kvStub = makeKvStub();
        const mocks = makeSanityMocks();
        mocks.getTeamPlayerPsdIds.mockReturnValue(
          Effect.succeed(["501", "502"]),
        );

        const { result } = await once(
          kvStub,
          mocks,
          perTeamPsd([team(1), team(2)], { 1: [] }),
        );

        expect(Either.isRight(result)).toBe(true);
        expect(mocks.upsertTeam).not.toHaveBeenCalled();
        expect(await idsIn(kvStub, "sync:cycle-player-ids")).toEqual([
          "501",
          "502",
        ]);
        expect(await idsIn(kvStub, "sync:cycle-team-ids")).toEqual(["1"]);
        expect(await kvStub.get(MARKER)).not.toBeNull();
        expect(mocks.getTeamPlayerPsdIds).toHaveBeenCalledWith("1");
      });

      it("trusts a second consecutive empty roster: writes players [] and deletes the marker", async () => {
        const kvStub = makeKvStub();
        await kvStub.put(MARKER, "1");
        const mocks = makeSanityMocks();
        mocks.getTeamPlayerPsdIds.mockReturnValue(Effect.succeed(["501"]));

        await once(kvStub, mocks, perTeamPsd([team(1), team(2)], { 1: [] }));

        expect(mocks.upsertTeam).toHaveBeenCalledWith(
          expect.objectContaining({ psdId: "1", playerPsdIds: [] }),
        );
        expect(await kvStub.get(MARKER)).toBeNull();
        // trusted: the old player is NOT protected from the cycle-end archive
        expect(await idsIn(kvStub, "sync:cycle-player-ids")).toEqual([]);
      });

      it("clears the marker when the roster is non-empty again", async () => {
        const kvStub = makeKvStub();
        await kvStub.put(MARKER, "1");
        const mocks = makeSanityMocks();

        await once(
          kvStub,
          mocks,
          perTeamPsd([team(1), team(2)], { 1: [player(501)] }),
        );

        expect(mocks.upsertTeam).toHaveBeenCalledWith(
          expect.objectContaining({ playerPsdIds: ["501"] }),
        );
        expect(await kvStub.get(MARKER)).toBeNull();
      });

      it("writes an empty team normally when Sanity holds no player for it either", async () => {
        const kvStub = makeKvStub();
        const mocks = makeSanityMocks(); // getTeamPlayerPsdIds → []

        await once(kvStub, mocks, perTeamPsd([team(1), team(2)], { 1: [] }));

        expect(mocks.upsertTeam).toHaveBeenCalledOnce();
        expect(await kvStub.get(MARKER)).toBeNull();
      });
    });

    describe("member isolation", () => {
      const failOn =
        (...failing: string[]) =>
        (doc: { psdId: string }) =>
          failing.includes(doc.psdId)
            ? Effect.fail(new SanityMutationError("boom"))
            : Effect.succeed(undefined as void);

      it("finishes the team around a failed NEW player: left out of upsertTeam, kept in the accumulator, cursor advances, run fails naming the psd id", async () => {
        const kvStub = makeKvStub();
        const mocks = makeSanityMocks();
        mocks.upsertPlayer.mockImplementation(failOn("502") as never);

        const { result } = await once(
          kvStub,
          mocks,
          perTeamPsd([team(1), team(2)], {
            1: [player(501), player(502), player(503)],
          }),
        );

        expect(mocks.upsertPlayer).toHaveBeenCalledTimes(3);
        expect(mocks.upsertTeam).toHaveBeenCalledWith(
          expect.objectContaining({ playerPsdIds: ["501", "503"] }),
        );
        expect(await idsIn(kvStub, "sync:cycle-player-ids")).toEqual([
          "501",
          "502",
          "503",
        ]);
        expect(await kvStub.get("sync:team-cursor")).toBe("1");
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) expect(String(result.left)).toContain("502");
      });

      it("keeps a failed EXISTING player in the team (its doc is there for the strong reference)", async () => {
        const kvStub = makeKvStub();
        const mocks = makeSanityMocks();
        mocks.getPlayersImageState.mockReturnValue(
          Effect.succeed(
            new Map([["502", { psdImageUrl: null, hasPsdImage: false }]]),
          ),
        );
        mocks.upsertPlayer.mockImplementation(failOn("502") as never);

        const { result } = await once(
          kvStub,
          mocks,
          perTeamPsd([team(1), team(2)], { 1: [player(501), player(502)] }),
        );

        expect(mocks.upsertTeam).toHaveBeenCalledWith(
          expect.objectContaining({ playerPsdIds: ["501", "502"] }),
        );
        expect(Either.isLeft(result)).toBe(true);
      });

      it("isolates staff the same way", async () => {
        const kvStub = makeKvStub();
        const mocks = makeSanityMocks();
        mocks.upsertStaff.mockImplementation(failOn("601") as never);

        const { result } = await once(
          kvStub,
          mocks,
          perTeamPsd(
            [team(1), team(2)],
            { 1: [player(501)] },
            { 1: [staffer(601), staffer(602)] },
          ),
        );

        expect(mocks.upsertStaff).toHaveBeenCalledTimes(2);
        expect(mocks.upsertTeam).toHaveBeenCalledWith(
          expect.objectContaining({ staffPsdIds: ["602"] }),
        );
        expect(await idsIn(kvStub, "sync:cycle-staff-ids")).toEqual([
          "601",
          "602",
        ]);
        expect(await kvStub.get("sync:team-cursor")).toBe("1");
        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) expect(String(result.left)).toContain("601");
      });
    });

    it("advances the cursor without accumulating the team, then fails, when the member fetch fails", async () => {
      const kvStub = makeKvStub();
      const mocks = makeSanityMocks();
      const psd: PsdTeamClientInterface = {
        ...perTeamPsd([team(1), team(2)], {}),
        getRawMembers: () =>
          Effect.fail(new PsdTeamClientError("PSD down")) as never,
      };

      const { result } = await once(kvStub, mocks, psd);

      expect(Either.isLeft(result)).toBe(true);
      expect(await kvStub.get("sync:team-cursor")).toBe("1");
      expect(mocks.upsertTeam).not.toHaveBeenCalled();
      expect(await idsIn(kvStub, "sync:cycle-team-ids")).toEqual([]);
    });

    describe("manual runs (SYNC_MANUAL_RUN)", () => {
      it("on the last index: no reconciliation, no accumulator write, no accumulator clear, cursor still advances", async () => {
        const kvStub = makeKvStub();
        await kvStub.put("sync:team-cursor", "1");
        await kvStub.put("sync:cycle-team-ids", JSON.stringify(["1"]));
        await kvStub.put("sync:cycle-player-ids", JSON.stringify(["101"]));
        kvStub.put.mockClear();
        const mocks = makeSanityMocks();
        mocks.getActivePlayerPsdIds.mockReturnValue(
          Effect.succeed(["101", "999"]),
        );

        const { result } = await once(
          kvStub,
          mocks,
          perTeamPsd([team(1), team(2)], { 2: [player(102)] }),
          { SYNC_MANUAL_RUN: "1" },
        );

        expect(Either.isRight(result)).toBe(true);
        expect(Either.isRight(result) && result.right.cleanup).toEqual({
          kind: "not-run",
        });
        expect(mocks.upsertTeam).toHaveBeenCalledOnce();
        expect(mocks.archivePlayers).not.toHaveBeenCalled();
        expect(mocks.archiveTeams).not.toHaveBeenCalled();
        // The per-team checkpoint is not cycle state; only these are.
        const written = kvStub.put.mock.calls.map((c) => c[0]);
        expect(written).toContain("sync:team-cursor");
        expect(
          written.filter(
            (k) => k.startsWith("sync:cycle-") || k.startsWith("sync:empty-"),
          ),
        ).toEqual([]);
        expect(kvStub.delete).not.toHaveBeenCalledWith("sync:cycle-team-ids");
        expect(await kvStub.get("sync:cycle-team-ids")).toBe('["1"]');
        expect(await kvStub.get("sync:team-cursor")).toBe("0");
      });

      it("a manual run on a zero roster neither accumulates nor writes the marker, but still holds the team back", async () => {
        const kvStub = makeKvStub();
        const mocks = makeSanityMocks();
        mocks.getTeamPlayerPsdIds.mockReturnValue(Effect.succeed(["501"]));

        await once(kvStub, mocks, perTeamPsd([team(1), team(2)], { 1: [] }), {
          SYNC_MANUAL_RUN: "1",
        });

        expect(mocks.upsertTeam).not.toHaveBeenCalled();
        // The per-team checkpoint is not cycle state; only these are.
        const written = kvStub.put.mock.calls.map((c) => c[0]);
        expect(written).toContain("sync:team-cursor");
        expect(
          written.filter(
            (k) => k.startsWith("sync:cycle-") || k.startsWith("sync:empty-"),
          ),
        ).toEqual([]);
      });

      it('only the literal "1" counts', async () => {
        const kvStub = makeKvStub();
        await kvStub.put("sync:team-cursor", "1");
        const mocks = makeSanityMocks();
        mocks.getActivePlayerPsdIds.mockReturnValue(
          Effect.succeed(["102", "a", "b", "c", "d", "e", "f", "g", "h", "i"]),
        );

        await once(
          kvStub,
          mocks,
          perTeamPsd([team(1), team(2)], { 2: [player(102)] }),
          { SYNC_MANUAL_RUN: "true" },
        );

        // reconciliation ran (cycle-end keys cleared)
        expect(kvStub.delete).toHaveBeenCalledWith("sync:cycle-team-ids");
      });
    });
  });
});

interface TeamCheckpointShape {
  teamId: number;
  donePlayerIds: string[];
  doneStaffIds: string[];
}
