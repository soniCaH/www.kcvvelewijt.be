import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import { runSync } from "./psd-sanity-sync";
import type { SanityWriteClientInterface } from "../sanity/client";
import { SanityWriteClient } from "../sanity/client";
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
});
