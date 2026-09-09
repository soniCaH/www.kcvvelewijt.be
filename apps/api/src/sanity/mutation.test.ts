import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import {
  PSD_PLACEHOLDER_IMAGE_SHA1,
  SanityMutation,
  SanityMutationLive,
  SanityMutationError,
} from "./mutation";
import { WorkerEnvTag } from "../env";
import { KvCacheLive } from "../cache/kv-cache";

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

const mockGetDocument = vi.fn().mockResolvedValue(null);

vi.mock("@sanity/client", () => ({
  createClient: () => ({
    transaction: mockTransaction,
    patch: mockClientPatch,
    create: mockCreate,
    getDocument: mockGetDocument,
  }),
}));

// ─── Test layer ──────────────────────────────────────────────────────────────

function makeTestLayer() {
  const envLayer = Layer.succeed(WorkerEnvTag, {
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
    PSD_GATE: {} as DurableObjectNamespace,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "test",
    SANITY_API_TOKEN: "test-token",
    SANITY_WEBHOOK_SECRET: "",
    AI: {} as Ai,
    SEARCH_INDEX: {} as VectorizeIndex,
  });
  return SanityMutationLive.pipe(
    Layer.provide(KvCacheLive),
    Layer.provide(envLayer),
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
        keeper: false,
        positionPsd: "MV",
        archived: false,
      }),
    );
    const payload = mockSet.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("nationality");
    expect(payload).not.toHaveProperty("height");
    expect(payload).not.toHaveProperty("weight");
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
  it("creates a transaction with slug, player refs, and staff as objects", async () => {
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
          {
            _key: "300",
            _type: "object",
            member: { _type: "reference", _ref: "staffMember-psd-300" },
          },
        ],
        archived: false,
      }),
    );
  });

  it("preserves existing editorial role values on staff objects", async () => {
    mockGetDocument.mockResolvedValueOnce({
      _id: "team-psd-42",
      _type: "team",
      staff: [
        {
          _key: "300",
          _type: "object",
          member: { _type: "reference", _ref: "staffMember-psd-300" },
          role: "trainer",
        },
        {
          _key: "301",
          _type: "object",
          member: { _type: "reference", _ref: "staffMember-psd-301" },
          role: "afgevaardigde",
        },
      ],
    });

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
          playerPsdIds: [],
          staffPsdIds: ["300", "301"],
        });
      }),
    );

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        staff: [
          {
            _key: "300",
            _type: "object",
            member: { _type: "reference", _ref: "staffMember-psd-300" },
            role: "trainer",
          },
          {
            _key: "301",
            _type: "object",
            member: { _type: "reference", _ref: "staffMember-psd-301" },
            role: "afgevaardigde",
          },
        ],
      }),
    );
  });

  it("keeps the editorial order of staff and players, appending newcomers (#2892)", async () => {
    // The editor ordered staff T1 → T2 → afgevaardigde in Studio, and players
    // defenders → midfield → attackers. PSD reports its own order, plus one
    // new signing (203) and one new staff member (303), and no longer reports
    // the departed player 201.
    mockGetDocument.mockResolvedValueOnce({
      _id: "team-psd-42",
      _type: "team",
      staff: [
        {
          _key: "302",
          _type: "object",
          member: { _type: "reference", _ref: "staffMember-psd-302" },
          role: "trainer",
        },
        {
          _key: "300",
          _type: "object",
          member: { _type: "reference", _ref: "staffMember-psd-300" },
        },
      ],
      players: [
        { _type: "reference", _ref: "player-psd-202", _key: "202" },
        { _type: "reference", _ref: "player-psd-200", _key: "200" },
        { _type: "reference", _ref: "player-psd-201", _key: "201" },
      ],
    });

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
          // PSD's own order — deliberately different from the stored order.
          playerPsdIds: ["200", "202", "203"],
          staffPsdIds: ["300", "302", "303"],
        });
      }),
    );

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        // 302 before 300, as the editor left it; 303 appended; role kept.
        staff: [
          {
            _key: "302",
            _type: "object",
            member: { _type: "reference", _ref: "staffMember-psd-302" },
            role: "trainer",
          },
          {
            _key: "300",
            _type: "object",
            member: { _type: "reference", _ref: "staffMember-psd-300" },
          },
          {
            _key: "303",
            _type: "object",
            member: { _type: "reference", _ref: "staffMember-psd-303" },
          },
        ],
        // 202 before 200, as the editor left it; departed 201 dropped without
        // disturbing the rest; new signing 203 appended.
        players: [
          { _type: "reference", _ref: "player-psd-202", _key: "202" },
          { _type: "reference", _ref: "player-psd-200", _key: "200" },
          { _type: "reference", _ref: "player-psd-203", _key: "203" },
        ],
      }),
    );
  });

  it("keeps an editor-added staff row in place, whatever Studio keyed it (#2892 review)", async () => {
    // Studio assigns its own random `_key` to a row an editor adds. Matching on
    // `_key` first would read that row as unknown and shove it to the end on the
    // next sync — the regression this fix exists for, in the workflow where an
    // editor is the one acting. The reference is the identity.
    mockGetDocument.mockResolvedValueOnce({
      _id: "team-psd-42",
      _type: "team",
      staff: [
        {
          _key: "a3f9c1e07b24",
          _type: "object",
          member: { _type: "reference", _ref: "staffMember-psd-301" },
          role: "trainer",
        },
        {
          _key: "300",
          _type: "object",
          member: { _type: "reference", _ref: "staffMember-psd-300" },
        },
      ],
    });

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
          playerPsdIds: [],
          staffPsdIds: ["300", "301"],
        });
      }),
    );

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        staff: [
          {
            _key: "301",
            _type: "object",
            member: { _type: "reference", _ref: "staffMember-psd-301" },
            role: "trainer",
          },
          {
            _key: "300",
            _type: "object",
            member: { _type: "reference", _ref: "staffMember-psd-300" },
          },
        ],
      }),
    );
  });

  it("uses PSD order on a team that does not exist yet (#2892)", async () => {
    // No stored document means no editorial order to protect.
    mockGetDocument.mockResolvedValueOnce(undefined);

    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.upsertTeam({
          psdId: "99",
          name: "Nieuwe Ploeg",
          slug: "nieuwe-ploeg",
          age: "U13",
          gender: "mannen",
          footbelId: null,
          playerPsdIds: ["500", "501"],
          staffPsdIds: ["600"],
        });
      }),
    );

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        players: [
          { _type: "reference", _ref: "player-psd-500", _key: "500" },
          { _type: "reference", _ref: "player-psd-501", _key: "501" },
        ],
        staff: [
          {
            _key: "600",
            _type: "object",
            member: { _type: "reference", _ref: "staffMember-psd-600" },
          },
        ],
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

    // archivePlayers returns early before calling client.transaction() when psdIds is empty
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

  it("skips upload and patch when bytes match the PSD placeholder SHA-1 (#1895)", async () => {
    // Build a 20-byte buffer that hex-encodes to PSD_PLACEHOLDER_IMAGE_SHA1
    // so the SHA-1 digest call returns the known placeholder hash.
    const placeholderHashBytes = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
      placeholderHashBytes[i] = parseInt(
        PSD_PLACEHOLDER_IMAGE_SHA1.slice(i * 2, i * 2 + 2),
        16,
      );
    }
    const digestSpy = vi
      .spyOn(crypto.subtle, "digest")
      .mockResolvedValueOnce(placeholderHashBytes.buffer);

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    // Only one fetch is expected (PSD); the Sanity upload must NOT fire.
    fetchSpy.mockResolvedValueOnce(
      new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );

    const patchCallsBefore = mockClientPatch.mock.calls.length;

    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.uploadPlayerImage(
          "42",
          "https://kcvv.prosoccerdata.com/img/placeholder.jpg?profileAccessKey=abc",
          "https://kcvv.prosoccerdata.com/img/placeholder.jpg?v=1",
        );
      }),
    );

    expect(digestSpy).toHaveBeenCalledTimes(1);
    expect(digestSpy).toHaveBeenCalledWith("SHA-1", expect.any(ArrayBuffer));
    // Exactly one fetch (PSD) — Sanity upload was never invoked
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // psdImage patch was NOT issued
    expect(mockClientPatch.mock.calls.length).toBe(patchCallsBefore);

    digestSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it("uploads + patches when bytes do NOT match the PSD placeholder SHA-1", async () => {
    // Force the digest to return a non-placeholder hash (all zeros) so the
    // skip branch does not fire and the upload path runs to completion.
    const nonPlaceholderHashBytes = new Uint8Array(20);
    const digestSpy = vi
      .spyOn(crypto.subtle, "digest")
      .mockResolvedValueOnce(nonPlaceholderHashBytes.buffer);

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(
      new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ document: { _id: "image-real-bytes" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.uploadPlayerImage(
          "99",
          "https://kcvv.prosoccerdata.com/img/real.jpg?profileAccessKey=xyz",
          "https://kcvv.prosoccerdata.com/img/real.jpg?v=1",
        );
      }),
    );

    // PSD fetch + Sanity upload both happened
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    // psdImage patch fired with the new asset _id
    expect(mockClientPatch).toHaveBeenCalledWith("player-psd-99");
    const lastPatchResult =
      mockClientPatch.mock.results[mockClientPatch.mock.results.length - 1]!
        .value.set;
    expect(lastPatchResult).toHaveBeenCalledWith(
      expect.objectContaining({
        psdImage: {
          _type: "image",
          asset: { _type: "reference", _ref: "image-real-bytes" },
        },
      }),
    );

    digestSpy.mockRestore();
    fetchSpy.mockRestore();
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

// ─── uploadStaffImage (#2895) — mirrors uploadPlayerImage's own tests ───────

describe("uploadStaffImage", () => {
  it("uploads image and patches staffMember doc on success", async () => {
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
      new Response(JSON.stringify({ document: { _id: "image-staff-abc" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.uploadStaffImage(
          "8001",
          "https://kcvv.prosoccerdata.com/img/staff.jpg?profileAccessKey=abc",
          "https://kcvv.prosoccerdata.com/img/staff.jpg?v=1",
        );
      }),
    );

    // PSD image was fetched
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://kcvv.prosoccerdata.com/img/staff.jpg?profileAccessKey=abc",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    // staffMember doc was patched with psdImage and psdImageUrl — never `photo`
    expect(mockClientPatch).toHaveBeenCalledWith("staffMember-psd-8001");
    const setFn = mockClientPatch.mock.results[0]!.value.set;
    expect(setFn).toHaveBeenCalledWith({
      psdImage: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-staff-abc" },
      },
      psdImageUrl: "https://kcvv.prosoccerdata.com/img/staff.jpg?v=1",
    });
    expect(setFn).not.toHaveBeenCalledWith(
      expect.objectContaining({ photo: expect.anything() }),
    );

    fetchSpy.mockRestore();
  });

  it("skips upload and patch when bytes match the PSD placeholder SHA-1", async () => {
    const placeholderHashBytes = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
      placeholderHashBytes[i] = parseInt(
        PSD_PLACEHOLDER_IMAGE_SHA1.slice(i * 2, i * 2 + 2),
        16,
      );
    }
    const digestSpy = vi
      .spyOn(crypto.subtle, "digest")
      .mockResolvedValueOnce(placeholderHashBytes.buffer);

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(
      new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );

    const patchCallsBefore = mockClientPatch.mock.calls.length;

    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.uploadStaffImage(
          "8001",
          "https://kcvv.prosoccerdata.com/img/placeholder.jpg?profileAccessKey=abc",
          "https://kcvv.prosoccerdata.com/img/placeholder.jpg?v=1",
        );
      }),
    );

    expect(digestSpy).toHaveBeenCalledTimes(1);
    // Exactly one fetch (PSD) — Sanity upload was never invoked
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // psdImage patch was NOT issued — the staff-detail name fallback renders
    expect(mockClientPatch.mock.calls.length).toBe(patchCallsBefore);

    digestSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it("uploads + patches when bytes do NOT match the PSD placeholder SHA-1", async () => {
    const nonPlaceholderHashBytes = new Uint8Array(20);
    const digestSpy = vi
      .spyOn(crypto.subtle, "digest")
      .mockResolvedValueOnce(nonPlaceholderHashBytes.buffer);

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(
      new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ document: { _id: "image-staff-real" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await run(
      Effect.gen(function* () {
        const mutation = yield* SanityMutation;
        yield* mutation.uploadStaffImage(
          "9002",
          "https://kcvv.prosoccerdata.com/img/real.jpg?profileAccessKey=xyz",
          "https://kcvv.prosoccerdata.com/img/real.jpg?v=1",
        );
      }),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(mockClientPatch).toHaveBeenCalledWith("staffMember-psd-9002");
    const lastPatchResult =
      mockClientPatch.mock.results[mockClientPatch.mock.results.length - 1]!
        .value.set;
    expect(lastPatchResult).toHaveBeenCalledWith(
      expect.objectContaining({
        psdImage: {
          _type: "image",
          asset: { _type: "reference", _ref: "image-staff-real" },
        },
      }),
    );

    digestSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it("rejects image URLs from wrong host, same as uploadPlayerImage", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const mutation = yield* SanityMutation;
          yield* mutation.uploadStaffImage(
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
});
