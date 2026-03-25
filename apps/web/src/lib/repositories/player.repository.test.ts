import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { PLAYERS_QUERY_RESULT } from "../sanity/sanity.types";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import {
  PlayerRepository,
  PlayerRepositoryLive,
  type PlayerVM,
} from "./player.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, PlayerRepository>) {
  return Effect.runPromise(Effect.provide(effect, PlayerRepositoryLive));
}

// Fixture: a full player row as returned by the GROQ query
function makePlayerRow(
  overrides: Partial<PLAYERS_QUERY_RESULT[number]> = {},
): PLAYERS_QUERY_RESULT[number] {
  return {
    _id: "player-1",
    psdId: "12345",
    firstName: "Jan",
    lastName: "Janssens",
    jerseyNumber: 7,
    keeper: false,
    positionPsd: "Middenvelder",
    position: "Aanvaller",
    birthDate: "1995-03-15",
    nationality: "Belgisch",
    height: 180,
    weight: 75,
    psdImageUrl: "https://cdn.sanity.io/psd.webp",
    transparentImageUrl: "https://cdn.sanity.io/transparent.webp",
    celebrationImageUrl: "https://cdn.sanity.io/celebration.webp",
    bio: [
      {
        _type: "block",
        _key: "k1",
        children: [{ _type: "span", _key: "s1", text: "Bio text" }],
        style: "normal",
      },
    ],
    ...overrides,
  };
}

describe("PlayerRepository", () => {
  describe("findAll", () => {
    it("maps all PlayerVM fields correctly from GROQ result", async () => {
      const row = makePlayerRow();
      mockFetch.mockResolvedValueOnce([row]);

      const players = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );

      expect(players).toHaveLength(1);
      const p = players[0];
      expect(p).toEqual<PlayerVM>({
        id: "player-1",
        firstName: "Jan",
        lastName: "Janssens",
        position: "Aanvaller",
        number: 7,
        imageUrl: "https://cdn.sanity.io/transparent.webp",
        href: "/spelers/12345",
        bio: row.bio,
        birthDate: "1995-03-15",
        nationality: "Belgisch",
        height: 180,
        weight: 75,
      });
    });

    it("position fallback: keeper flag overrides position", async () => {
      mockFetch.mockResolvedValueOnce([
        makePlayerRow({ keeper: true, position: "Verdediger" }),
      ]);

      const [p] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );

      expect(p.position).toBe("Keeper");
    });

    it("position fallback: position → positionPsd → 'Speler'", async () => {
      // When position is null, falls back to positionPsd
      mockFetch.mockResolvedValueOnce([
        makePlayerRow({
          keeper: false,
          position: null,
          positionPsd: "Verdediger",
        }),
      ]);

      const [p1] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );
      expect(p1.position).toBe("Verdediger");

      // When both null, falls back to "Speler"
      mockFetch.mockResolvedValueOnce([
        makePlayerRow({ keeper: false, position: null, positionPsd: null }),
      ]);

      const [p2] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );
      expect(p2.position).toBe("Speler");
    });

    it("position fallback: keeper null treated as false", async () => {
      mockFetch.mockResolvedValueOnce([
        makePlayerRow({ keeper: null, position: null, positionPsd: null }),
      ]);

      const [p] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );
      expect(p.position).toBe("Speler");
    });

    it("imageUrl fallback: transparentImageUrl → psdImageUrl → undefined", async () => {
      // Prefers transparentImageUrl
      mockFetch.mockResolvedValueOnce([
        makePlayerRow({
          transparentImageUrl: "https://cdn.sanity.io/transparent.webp",
          psdImageUrl: "https://cdn.sanity.io/psd.webp",
        }),
      ]);

      const [p1] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );
      expect(p1.imageUrl).toBe("https://cdn.sanity.io/transparent.webp");

      // Falls back to psdImageUrl
      mockFetch.mockResolvedValueOnce([
        makePlayerRow({ transparentImageUrl: null }),
      ]);

      const [p2] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );
      expect(p2.imageUrl).toBe("https://cdn.sanity.io/psd.webp");

      // Both null → undefined
      mockFetch.mockResolvedValueOnce([
        makePlayerRow({ transparentImageUrl: null, psdImageUrl: null }),
      ]);

      const [p3] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );
      expect(p3.imageUrl).toBeUndefined();
    });

    it("null firstName/lastName become empty strings", async () => {
      mockFetch.mockResolvedValueOnce([
        makePlayerRow({ firstName: null, lastName: null }),
      ]);

      const [p] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );
      expect(p.firstName).toBe("");
      expect(p.lastName).toBe("");
    });

    it("null optional fields become undefined", async () => {
      mockFetch.mockResolvedValueOnce([
        makePlayerRow({
          jerseyNumber: null,
          birthDate: null,
          nationality: null,
          height: null,
          weight: null,
          bio: null,
        }),
      ]);

      const [p] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );
      expect(p.number).toBeUndefined();
      expect(p.birthDate).toBeUndefined();
      expect(p.nationality).toBeUndefined();
      expect(p.height).toBeUndefined();
      expect(p.weight).toBeUndefined();
      expect(p.bio).toBeUndefined();
    });

    it("player with null psdId has undefined href", async () => {
      mockFetch.mockResolvedValueOnce([makePlayerRow({ psdId: null })]);

      const [p] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findAll();
        }),
      );
      expect(p.href).toBeUndefined();
    });
  });

  describe("findByPsdId", () => {
    it("returns PlayerVM for existing player", async () => {
      mockFetch.mockResolvedValueOnce(makePlayerRow({ psdId: "99" }));

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findByPsdId("99");
        }),
      );

      expect(result).not.toBeNull();
      expect(result!.href).toBe("/spelers/99");
    });

    it("returns null for unknown psdId", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PlayerRepository;
          return yield* repo.findByPsdId("unknown-id");
        }),
      );

      expect(result).toBeNull();
    });
  });
});
