import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/search/team-guess (#3559)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("KCVV_API_URL", "http://localhost:8787");
    vi.stubEnv("BFF_SHARED_SECRET", "test-bff-secret");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards the body to the BFF's /search/team-guess and returns its answer", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ age: "U9" }));
    const body = { query: "pupillen", ages: ["U8", "U9"] };

    const response = await POST(
      new NextRequest("http://localhost:3000/api/search/team-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(await response.json()).toEqual({ age: "U9" });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8787/search/team-guess",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
      }),
    );
  });
});
