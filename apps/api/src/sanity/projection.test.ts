import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import {
  SanityProjection,
  SanityProjectionLive,
  SanityQueryError,
} from "./projection";
import { WorkerEnvTag } from "../env";

// ─── Mock Sanity client ──────────────────────────────────────────────────────

const mockFetch = vi.fn();

vi.mock("@sanity/client", () => ({
  createClient: () => ({ fetch: mockFetch }),
}));

function makeTestLayer() {
  return SanityProjectionLive.pipe(
    Layer.provide(
      Layer.succeed(WorkerEnvTag, {
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
      }),
    ),
  );
}

function run<A>(effect: Effect.Effect<A, SanityQueryError, SanityProjection>) {
  return Effect.runPromise(Effect.provide(effect, makeTestLayer()));
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getVisibleTeamPsdIds ────────────────────────────────────────────────────

describe("getVisibleTeamPsdIds", () => {
  it("returns filtered PSD IDs from GROQ query", async () => {
    mockFetch.mockResolvedValueOnce(["101", "202", null, "", "303"]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getVisibleTeamPsdIds();
      }),
    );

    expect(result).toEqual(["101", "202", "303"]);
    expect(mockFetch).toHaveBeenCalledWith(
      `*[_type == "team" && showInNavigation != false].psdId`,
    );
  });

  it("returns empty array when no teams are visible", async () => {
    mockFetch.mockResolvedValueOnce([]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getVisibleTeamPsdIds();
      }),
    );

    expect(result).toEqual([]);
  });

  it("fails with SanityQueryError on client error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getVisibleTeamPsdIds();
        }).pipe(Effect.provide(makeTestLayer())),
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(SanityQueryError);
    }
  });
});

// ─── getPlayersImageState ────────────────────────────────────────────────────

describe("getPlayersImageState", () => {
  it("returns a Map keyed by psdId with image state", async () => {
    mockFetch.mockResolvedValueOnce([
      {
        psdId: "p1",
        psdImageUrl: "https://example.com/img.jpg",
        hasPsdImage: true,
      },
      { psdId: "p2", psdImageUrl: null, hasPsdImage: false },
    ]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getPlayersImageState();
      }),
    );

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(2);
    expect(result.get("p1")).toEqual({
      psdImageUrl: "https://example.com/img.jpg",
      hasPsdImage: true,
    });
    expect(result.get("p2")).toEqual({
      psdImageUrl: null,
      hasPsdImage: false,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `*[_type == "player"] { psdId, psdImageUrl, "hasPsdImage": defined(psdImage) }`,
    );
  });

  it("returns empty Map when no players exist", async () => {
    mockFetch.mockResolvedValueOnce([]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getPlayersImageState();
      }),
    );

    expect(result.size).toBe(0);
  });

  it("fails with SanityQueryError on client error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getPlayersImageState();
        }).pipe(Effect.provide(makeTestLayer())),
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(SanityQueryError);
    }
  });
});

// ─── getActivePlayerPsdIds ───────────────────────────────────────────────────

describe("getActivePlayerPsdIds", () => {
  it("returns PSD IDs of non-archived players", async () => {
    mockFetch.mockResolvedValueOnce([{ psdId: "100" }, { psdId: "200" }]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getActivePlayerPsdIds();
      }),
    );

    expect(result).toEqual(["100", "200"]);
    expect(mockFetch).toHaveBeenCalledWith(
      `*[_type == "player" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
    );
  });

  it("returns empty array when no active players", async () => {
    mockFetch.mockResolvedValueOnce([]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getActivePlayerPsdIds();
      }),
    );

    expect(result).toEqual([]);
  });
});

// ─── getActiveStaffPsdIds ────────────────────────────────────────────────────

describe("getActiveStaffPsdIds", () => {
  it("returns PSD IDs of non-archived staff members", async () => {
    mockFetch.mockResolvedValueOnce([
      { psdId: "s1" },
      { psdId: "s2" },
      { psdId: "s3" },
    ]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getActiveStaffPsdIds();
      }),
    );

    expect(result).toEqual(["s1", "s2", "s3"]);
    expect(mockFetch).toHaveBeenCalledWith(
      `*[_type == "staffMember" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
    );
  });

  it("returns empty array when no active staff", async () => {
    mockFetch.mockResolvedValueOnce([]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getActiveStaffPsdIds();
      }),
    );

    expect(result).toEqual([]);
  });
});

// ─── getActiveTeamPsdIds ─────────────────────────────────────────────────────

describe("getActiveTeamPsdIds", () => {
  it("returns PSD IDs of non-archived teams", async () => {
    mockFetch.mockResolvedValueOnce([{ psdId: "t1" }, { psdId: "t2" }]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getActiveTeamPsdIds();
      }),
    );

    expect(result).toEqual(["t1", "t2"]);
    expect(mockFetch).toHaveBeenCalledWith(
      `*[_type == "team" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
    );
  });

  it("returns empty array when no active teams", async () => {
    mockFetch.mockResolvedValueOnce([]);

    const result = await run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getActiveTeamPsdIds();
      }),
    );

    expect(result).toEqual([]);
  });
});
