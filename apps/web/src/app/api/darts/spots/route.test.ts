import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

describe("GET /api/darts/spots", () => {
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

  it("passes the live count through, uncached, with the BFF key", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ spotsLeft: 9 }), { status: 200 }),
    );

    const response = await GET();

    expect(await response.json()).toEqual({ spotsLeft: 9 });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8787/forms/darts/spots",
      expect.objectContaining({
        cache: "no-store",
        headers: { "x-kcvv-bff-key": "test-bff-secret" },
      }),
    );
  });

  it("answers 503 without calling the BFF when it is not configured", async () => {
    vi.stubEnv("BFF_SHARED_SECRET", undefined);

    const response = await GET();

    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("answers 500 when the BFF cannot be reached", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("down"));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});
