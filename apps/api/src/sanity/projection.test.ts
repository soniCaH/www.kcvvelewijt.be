import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import {
  SanityProjection,
  SanityProjectionLive,
  SanityQueryError,
} from "./projection";
import { makeTestEnvLayer } from "../test-helpers/env-layer";

// ─── Mock Sanity client ──────────────────────────────────────────────────────

const mockFetch = vi.fn();

vi.mock("@sanity/client", () => ({
  createClient: () => ({ fetch: mockFetch }),
}));

function makeTestLayer() {
  return SanityProjectionLive.pipe(
    Layer.provide(
      makeTestEnvLayer({
        SANITY_PROJECT_ID: "test-project",
        SANITY_WEBHOOK_SECRET: "",
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
      `*[_type == "player" && defined(psdId) && psdId != ""] { psdId, psdImageUrl, "hasPsdImage": defined(psdImage) }`,
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

// ─── getTeamPlayerPsdIds ─────────────────────────────────────────────────────

describe("getTeamPlayerPsdIds", () => {
  const read = (teamPsdId: string) =>
    run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getTeamPlayerPsdIds(teamPsdId);
      }),
    );

  it("returns the PSD IDs of the players the team references, scoped by a GROQ param", async () => {
    mockFetch.mockResolvedValueOnce(["501", null, "502"]);

    expect(await read("42")).toEqual(["501", "502"]);
    expect(mockFetch).toHaveBeenCalledWith(
      `*[_type == "team" && psdId == $teamPsdId][0].players[]->psdId`,
      { teamPsdId: "42" },
    );
  });

  it("returns an empty array when the team doc is missing (GROQ yields null)", async () => {
    mockFetch.mockResolvedValueOnce(null);

    expect(await read("42")).toEqual([]);
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

// ─── getStaffGaps ────────────────────────────────────────────────────────────

describe("getStaffGaps", () => {
  const read = () =>
    run(
      Effect.gen(function* () {
        const projection = yield* SanityProjection;
        return yield* projection.getStaffGaps();
      }),
    );

  it("reads all three groups in ONE query and flattens empty roles per team", async () => {
    mockFetch.mockResolvedValueOnce({
      emptyRoles: [
        {
          teamId: "team-a",
          teamName: "U13 A",
          entries: [
            { firstName: "Jan", lastName: "Peeters" },
            { firstName: null, lastName: null },
          ],
        },
      ],
      noPhoto: [{ id: "s1", firstName: "An", lastName: "Smet" }],
      coordinators: [
        {
          id: "n1",
          roleCode: "TVJO",
          title: "TVJO",
          active: false,
          memberCount: 2,
        },
      ],
      missingRoleCodes: ["JC-BB"],
    });

    const result = await read();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      emptyRoles: [
        { teamId: "team-a", teamName: "U13 A", memberName: "Jan Peeters" },
        { teamId: "team-a", teamName: "U13 A", memberName: null },
      ],
      noPhoto: [{ id: "s1", name: "An Smet" }],
      coordinators: [
        {
          id: "n1",
          roleCode: "TVJO",
          title: "TVJO",
          active: false,
          memberCount: 2,
        },
      ],
      missingRoleCodes: ["JC-BB"],
    });
  });

  it("reports only an EMPTY role — never 'andere' — on active PSD teams", async () => {
    mockFetch.mockResolvedValueOnce({
      emptyRoles: [],
      noPhoto: [],
      coordinators: [],
      missingRoleCodes: [],
    });
    await read();
    const [query, params] = mockFetch.mock.calls[0] as [string, unknown];
    expect(query).toContain(`staff[!defined(role) || role == ""]`);
    expect(query).not.toContain("andere");
    expect(query).toContain(
      `archived != true && defined(psdId) && psdId != ""`,
    );
    expect(query).toContain("!defined(photo) && !defined(psdImage)");
    // A coordinator counts only live members — an archived or dangling
    // reference leaves the box as empty as the web's TeamCard sees it.
    expect(query).toContain("members[defined(@->_id) && @->archived != true]");
    expect(query).toContain(
      `$coordinatorCodes[!(@ in *[_type == "organigramNode"].roleCode)]`,
    );
    expect(params).toEqual({
      coordinatorCodes: ["TVJO", "JC-OB", "JC-MB", "JC-BB"],
    });
  });

  it("fails with SanityQueryError on client error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));
    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          const projection = yield* SanityProjection;
          return yield* projection.getStaffGaps();
        }).pipe(Effect.provide(makeTestLayer())),
      ),
    );
    expect(result._tag).toBe("Left");
  });
});
