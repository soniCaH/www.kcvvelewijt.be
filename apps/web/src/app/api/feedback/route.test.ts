/**
 * Feedback API Route Tests (#3348)
 *
 * Thin proxy to the BFF `/feedback`. Only the outer boundary is mocked —
 * global `fetch` and `KCVV_API_URL`. Unlike the membership proxy, the BFF
 * body is never passed through: the route answers `{ ok }` with the BFF status.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

const TEST_BFF_URL = "http://localhost:8787";

function makeRequest(body: BodyInit): Request {
  return new Request("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("KCVV_API_URL", TEST_BFF_URL);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns 503 when KCVV_API_URL is unset", async () => {
    vi.stubEnv("KCVV_API_URL", undefined);

    const response = await POST(makeRequest(JSON.stringify({ message: "hi" })));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Feedback service not configured",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not JSON, without calling the BFF", async () => {
    const response = await POST(makeRequest("not json {"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "Invalid JSON" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("forwards the body to the BFF feedback endpoint", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ ok: true }, { status: 200 }),
    );
    const payload = { message: "Mooie site", page: "/nieuws" };

    const response = await POST(makeRequest(JSON.stringify(payload)));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_BFF_URL}/feedback`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  });

  it("answers { ok } with the BFF status and drops the BFF body", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json(
        { ok: false, errors: { message: "leeg" } },
        { status: 400 },
      ),
    );

    const response = await POST(makeRequest(JSON.stringify({})));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false });
  });

  it("returns 500 and logs when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network down"));

    const response = await POST(makeRequest(JSON.stringify({})));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Failed to submit feedback",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[Feedback API] Proxy error:",
      expect.any(Error),
    );
  });
});
