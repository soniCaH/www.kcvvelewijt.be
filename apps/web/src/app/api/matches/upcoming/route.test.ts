import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

const LIST = [{ id: 3414, date: "2026-11-30T15:00:00.000Z" }];

describe("GET /api/matches/upcoming (#3920)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("KCVV_API_URL", "http://localhost:8787");
    vi.stubEnv("BFF_SHARED_SECRET", "test-bff-secret");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("serves the BFF list, CDN-cached for at least a day, to any origin", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(LIST), { status: 200 }),
    );

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(LIST);
    const sMaxAge = /s-maxage=(\d+)/.exec(
      response.headers.get("Cache-Control") ?? "",
    );
    expect(Number(sMaxAge?.[1])).toBeGreaterThanOrEqual(86_400);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8787/matches/upcoming",
      expect.objectContaining({
        headers: { "x-kcvv-bff-key": "test-bff-secret" },
      }),
    );
  });

  it("never caches a failed BFF answer", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 503 }));

    const response = await GET();

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("answers 502, uncached, when the BFF cannot be reached", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("down"));

    const response = await GET();

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("answers 503 without calling the BFF when it is not configured", async () => {
    vi.stubEnv("BFF_SHARED_SECRET", undefined);

    const response = await GET();

    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});
