import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

describe("POST /api/darts", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("KCVV_API_URL", "http://localhost:8787");
    vi.stubEnv("BFF_SHARED_SECRET", "test-bff-secret");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("proxies the signup to the BFF darts endpoint and passes its answer through", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true, waitlist: true }), {
        status: 200,
      }),
    );

    const response = await POST(
      new Request("http://localhost:3000/api/darts", {
        method: "POST",
        body: JSON.stringify({ teamName: "De Pijlenjagers" }),
      }),
    );

    expect(await response.json()).toEqual({ ok: true, waitlist: true });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8787/forms/darts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ teamName: "De Pijlenjagers" }),
      }),
    );
  });
});
