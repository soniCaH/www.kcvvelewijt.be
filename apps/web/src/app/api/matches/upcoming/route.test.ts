import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect, Layer } from "effect";

const { mockGetUpcomingMatches } = vi.hoisted(() => ({
  mockGetUpcomingMatches: vi.fn(),
}));

vi.mock("@/lib/effect/services/BffService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/effect/services/BffService")>();
  const unused = () => Effect.die("not used by this route");
  return {
    ...actual,
    BffServiceLive: Layer.succeed(actual.BffService, {
      getMatches: unused,
      getNextMatches: unused,
      getMatchesWindow: unused,
      getUpcomingMatches: mockGetUpcomingMatches,
      getMatchDetail: unused,
      getRanking: unused,
      getRelated: unused,
      getOpponentHistory: unused,
      getPlayerStats: unused,
    }),
  };
});

const { GET } = await import("./route");

const LIST = [{ id: 3414, date: "2026-11-30T15:00:00.000Z" }];

describe("GET /api/matches/upcoming (#3920)", () => {
  beforeEach(() => {
    mockGetUpcomingMatches.mockReset();
    vi.stubEnv("KCVV_API_URL", "http://localhost:8787");
    vi.stubEnv("BFF_SHARED_SECRET", "test-bff-secret");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("serves the BFF list, CDN-cached for at least a day, to any origin", async () => {
    mockGetUpcomingMatches.mockReturnValue(Effect.succeed(LIST));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(LIST);
    const sMaxAge = /s-maxage=(\d+)/.exec(
      response.headers.get("Cache-Control") ?? "",
    );
    expect(Number(sMaxAge?.[1])).toBeGreaterThanOrEqual(86_400);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("never caches a failed BFF answer", async () => {
    mockGetUpcomingMatches.mockReturnValue(Effect.fail(new Error("503")));

    const response = await GET();

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("answers 502, uncached, when the BFF call breaks", async () => {
    mockGetUpcomingMatches.mockReturnValue(Effect.die(new Error("down")));

    const response = await GET();

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("answers 503 without calling the BFF when it is not configured", async () => {
    vi.stubEnv("BFF_SHARED_SECRET", undefined);

    const response = await GET();

    expect(response.status).toBe(503);
    expect(mockGetUpcomingMatches).not.toHaveBeenCalled();
  });
});
