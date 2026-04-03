import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import {
  SanityMutation,
  SanityMutationLive,
  SanityMutationError,
} from "./mutation";
import { WorkerEnvTag } from "../env";

// ─── Mock Sanity client ──────────────────────────────────────────────────────

const mockSet = vi.fn().mockReturnThis();
const mockCommit = vi.fn().mockResolvedValue(undefined);
const mockCreateIfNotExists = vi.fn().mockReturnThis();
const mockCreate = vi.fn().mockResolvedValue(undefined);

// The transaction object needs to support chaining: tx.createIfNotExists().patch().commit()
// AND reassignment: tx = tx.patch(...) in a loop, then tx.commit()
function makeTxObject(): Record<string, unknown> {
  const tx: Record<string, unknown> = {};
  tx.createIfNotExists = mockCreateIfNotExists.mockImplementation(() => tx);
  tx.patch = vi.fn(
    (_id: string, fn: (p: { set: typeof mockSet }) => unknown) => {
      fn({ set: mockSet });
      return tx;
    },
  );
  tx.commit = mockCommit;
  return tx;
}

const mockTransaction = vi.fn(() => makeTxObject());

const mockClientPatch = vi.fn((_id: string) => ({
  set: vi.fn((_fields: Record<string, unknown>) => ({
    commit: mockCommit,
  })),
}));

vi.mock("@sanity/client", () => ({
  createClient: () => ({
    transaction: mockTransaction,
    patch: mockClientPatch,
    create: mockCreate,
  }),
}));

// ─── Test layer ──────────────────────────────────────────────────────────────

function makeTestLayer() {
  return SanityMutationLive.pipe(
    Layer.provide(
      Layer.succeed(WorkerEnvTag, {
        PSD_API_BASE_URL: "https://clubapi.prosoccerdata.com",
        PSD_IMAGE_BASE_URL: "https://kcvv.prosoccerdata.com",
        FOOTBALISTO_LOGO_CDN_URL: "https://cdn.example.com",
        PSD_API_KEY: "test-key",
        PSD_API_CLUB: "test-club",
        PSD_API_AUTH: "test-auth",
        PSD_CACHE: {
          get: vi.fn().mockResolvedValue(null),
          put: vi.fn().mockResolvedValue(undefined),
        } as unknown as KVNamespace,
        SANITY_PROJECT_ID: "test-project",
        SANITY_DATASET: "test",
        SANITY_API_TOKEN: "test-token",
        SANITY_WEBHOOK_SECRET: "",
        AI: {} as Ai,
        SEARCH_INDEX: {} as VectorizeIndex,
      }),
    ),
  );
}

function run<A>(effect: Effect.Effect<A, SanityMutationError, SanityMutation>) {
  return Effect.runPromise(Effect.provide(effect, makeTestLayer()));
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── upsertPlayer ───────────────────────────────────────────────────────────

describe("upsertPlayer", () => {
  it("creates a transaction with createIfNotExists + patch for player doc", async () => {
    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.upsertPlayer({
          psdId: "123",
          firstName: "Jan",
          lastName: "Janssens",
          birthDate: "1995-03-15",
          nationality: "Belgium",
          keeper: false,
          positionPsd: "MV",
        });
      }),
    );

    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockCreateIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "player-psd-123",
        _type: "player",
        psdId: "123",
      }),
    );
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        psdId: "123",
        firstName: "Jan",
        lastName: "Janssens",
        birthDate: "1995-03-15",
        nationality: "Belgium",
        keeper: false,
        positionPsd: "MV",
        archived: false,
      }),
    );
    expect(mockCommit).toHaveBeenCalled();
  });

  it("fails with SanityMutationError when transaction fails", async () => {
    mockCommit.mockRejectedValueOnce(new Error("Network error"));

    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const mutation = yield* SanityMutation;
          yield* mutation.upsertPlayer({
            psdId: "123",
            firstName: "Jan",
            lastName: "Janssens",
            birthDate: null,
            nationality: null,
            keeper: false,
            positionPsd: null,
          });
        }).pipe(Effect.provide(makeTestLayer())),
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(SanityMutationError);
    }
  });
});

// ─── upsertTeam ─────────────────────────────────────────────────────────────

describe("upsertTeam", () => {
  it("creates a transaction with slug, player refs, and staff refs", async () => {
    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.upsertTeam({
          psdId: "42",
          name: "Eerste Elftal A",
          slug: "eerste-elftal-a",
          age: "A",
          gender: "mannen",
          footbelId: 183904,
          playerPsdIds: ["100", "200"],
          staffPsdIds: ["300"],
        });
      }),
    );

    expect(mockCreateIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "team-psd-42",
        _type: "team",
        psdId: "42",
      }),
    );
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        psdId: "42",
        name: "Eerste Elftal A",
        slug: { _type: "slug", current: "eerste-elftal-a" },
        age: "A",
        gender: "mannen",
        footbelId: 183904,
        players: [
          { _type: "reference", _ref: "player-psd-100", _key: "100" },
          { _type: "reference", _ref: "player-psd-200", _key: "200" },
        ],
        staff: [
          { _type: "reference", _ref: "staffMember-psd-300", _key: "300" },
        ],
        archived: false,
      }),
    );
  });

  it("omits footbelId when null", async () => {
    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.upsertTeam({
          psdId: "42",
          name: "Team B",
          slug: "team-b",
          age: "U17",
          gender: "mannen",
          footbelId: null,
          playerPsdIds: [],
          staffPsdIds: [],
        });
      }),
    );

    expect(mockSet).toHaveBeenCalledWith(
      expect.not.objectContaining({ footbelId: expect.anything() }),
    );
  });
});

// ─── archivePlayers ─────────────────────────────────────────────────────────

describe("archivePlayers", () => {
  it("creates a transaction that patches archived: true for each player", async () => {
    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.archivePlayers(["100", "200"]);
      }),
    );

    expect(mockTransaction).toHaveBeenCalledOnce();

    const tx = mockTransaction.mock.results[0]!.value;
    expect(tx.patch).toHaveBeenCalledTimes(2);
    expect(tx.patch).toHaveBeenCalledWith(
      "player-psd-100",
      expect.any(Function),
    );
    expect(tx.patch).toHaveBeenCalledWith(
      "player-psd-200",
      expect.any(Function),
    );
    expect(mockSet).toHaveBeenCalledWith({ archived: true });

    expect(mockCommit).toHaveBeenCalled();
  });

  it("does nothing when psdIds array is empty", async () => {
    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.archivePlayers([]);
      }),
    );

    // Transaction is created but commit should see empty list → early return
    // The implementation returns early before committing
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it("fails with SanityMutationError when commit fails", async () => {
    mockCommit.mockRejectedValueOnce(new Error("Sanity down"));

    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const mutation = yield* SanityMutation;
          yield* mutation.archivePlayers(["100"]);
        }).pipe(Effect.provide(makeTestLayer())),
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(SanityMutationError);
    }
  });
});

// ─── uploadPlayerImage ──────────────────────────────────────────────────────

describe("uploadPlayerImage", () => {
  it("uploads image and patches player doc on success", async () => {
    const imageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // First call: PSD image fetch
    fetchSpy.mockResolvedValueOnce(
      new Response(imageBytes, {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );

    // Second call: Sanity asset upload
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ document: { _id: "image-abc123" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.uploadPlayerImage(
          "42",
          "https://kcvv.prosoccerdata.com/img/player.jpg?profileAccessKey=abc",
          "https://kcvv.prosoccerdata.com/img/player.jpg?v=1",
        );
      }),
    );

    // PSD image was fetched
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://kcvv.prosoccerdata.com/img/player.jpg?profileAccessKey=abc",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    // Player doc was patched with psdImage and psdImageUrl
    expect(mockClientPatch).toHaveBeenCalledWith("player-psd-42");
    const setFn = mockClientPatch.mock.results[0]!.value.set;
    expect(setFn).toHaveBeenCalledWith({
      psdImage: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-abc123" },
      },
      psdImageUrl: "https://kcvv.prosoccerdata.com/img/player.jpg?v=1",
    });

    fetchSpy.mockRestore();
  });

  it("rejects non-HTTPS image URLs", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const mutation = yield* SanityMutation;
          yield* mutation.uploadPlayerImage(
            "123",
            "http://evil.com/img.jpg",
            "http://evil.com/img.jpg",
          );
        }).pipe(Effect.provide(makeTestLayer())),
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(SanityMutationError);
      expect(result.left.message).toContain("not allowed");
    }
  });

  it("rejects image URLs from wrong host", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const mutation = yield* SanityMutation;
          yield* mutation.uploadPlayerImage(
            "123",
            "https://wrong-host.com/img.jpg",
            "https://wrong-host.com/img.jpg",
          );
        }).pipe(Effect.provide(makeTestLayer())),
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(SanityMutationError);
      expect(result.left.message).toContain("not allowed");
    }
  });

  it("rejects invalid URLs", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const mutation = yield* SanityMutation;
          yield* mutation.uploadPlayerImage("123", "not-a-url", "not-a-url");
        }).pipe(Effect.provide(makeTestLayer())),
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(SanityMutationError);
      expect(result.left.message).toContain("Invalid image URL");
    }
  });
});
