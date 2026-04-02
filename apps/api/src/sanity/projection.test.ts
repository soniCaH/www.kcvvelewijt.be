import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import { SanityProjection, SanityProjectionLive } from "./projection";
import { WorkerEnvTag } from "../env";

const fetchMock = vi.fn();

vi.mock("@sanity/client", () => ({
  createClient: () => ({ fetch: fetchMock }),
}));

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

const layer = SanityProjectionLive.pipe(Layer.provide(makeEnvLayer()));

function run<A>(effect: Effect.Effect<A, unknown, SanityProjection>) {
  return Effect.runPromise(Effect.provide(effect, layer));
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe("SanityProjection", () => {
  describe("getVisibleTeamPsdIds", () => {
    it("returns filtered PSD IDs, excluding nulls and empty strings", async () => {
      fetchMock.mockResolvedValue(["101", null, "", "202", null]);

      const result = await run(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getVisibleTeamPsdIds();
        }),
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `*[_type == "team" && showInNavigation != false].psdId`,
      );
      expect(result).toEqual(["101", "202"]);
    });

    it("returns empty array when no teams are visible", async () => {
      fetchMock.mockResolvedValue([]);

      const result = await run(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getVisibleTeamPsdIds();
        }),
      );

      expect(result).toEqual([]);
    });
  });

  describe("getPlayersImageState", () => {
    it("returns a Map keyed by psdId with image state", async () => {
      fetchMock.mockResolvedValue([
        { psdId: "p1", psdImageUrl: "https://img/1.jpg", hasPsdImage: true },
        { psdId: "p2", psdImageUrl: null, hasPsdImage: false },
      ]);

      const result = await run(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getPlayersImageState();
        }),
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `*[_type == "player"] { psdId, psdImageUrl, "hasPsdImage": defined(psdImage) }`,
      );
      expect(result).toBeInstanceOf(Map);
      expect(result.get("p1")).toEqual({
        psdImageUrl: "https://img/1.jpg",
        hasPsdImage: true,
      });
      expect(result.get("p2")).toEqual({
        psdImageUrl: null,
        hasPsdImage: false,
      });
    });

    it("returns empty Map when no players exist", async () => {
      fetchMock.mockResolvedValue([]);

      const result = await run(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getPlayersImageState();
        }),
      );

      expect(result.size).toBe(0);
    });
  });

  describe("getActivePlayerPsdIds", () => {
    it("returns PSD IDs of non-archived players", async () => {
      fetchMock.mockResolvedValue([{ psdId: "p1" }, { psdId: "p2" }]);

      const result = await run(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getActivePlayerPsdIds();
        }),
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `*[_type == "player" && archived != true] { psdId }`,
      );
      expect(result).toEqual(["p1", "p2"]);
    });

    it("returns empty array when no active players", async () => {
      fetchMock.mockResolvedValue([]);

      const result = await run(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getActivePlayerPsdIds();
        }),
      );

      expect(result).toEqual([]);
    });
  });

  describe("getActiveStaffPsdIds", () => {
    it("returns PSD IDs of non-archived staff with defined psdId", async () => {
      fetchMock.mockResolvedValue([{ psdId: "s1" }, { psdId: "s2" }]);

      const result = await run(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getActiveStaffPsdIds();
        }),
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `*[_type == "staffMember" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
      );
      expect(result).toEqual(["s1", "s2"]);
    });
  });

  describe("getActiveTeamPsdIds", () => {
    it("returns PSD IDs of non-archived teams with defined psdId", async () => {
      fetchMock.mockResolvedValue([{ psdId: "t1" }]);

      const result = await run(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getActiveTeamPsdIds();
        }),
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `*[_type == "team" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
      );
      expect(result).toEqual(["t1"]);
    });
  });
});
