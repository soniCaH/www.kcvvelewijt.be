/**
 * Related API Route Tests (#3348)
 *
 * GET proxy to the BFF `/related`. Only the outer boundary is mocked — global
 * `fetch` and `KCVV_API_URL`. Only the success path may be CDN-cached; every
 * `[]` fallback must carry no public cache header, so a transient BFF blip is
 * not pinned for 5 minutes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const TEST_BFF_URL = "http://localhost:8787";

function makeRequest(search: string): NextRequest {
  return new NextRequest(
    new URL(`/api/related${search}`, "http://localhost:3000"),
  );
}

describe("GET /api/related", () => {
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

  it("returns [] without calling the BFF when no id is given", async () => {
    const response = await GET(makeRequest(""));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("defaults limit to 3 in the BFF URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json([]));

    await GET(makeRequest("?id=abc"));

    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe(
      `${TEST_BFF_URL}/related?id=abc&limit=3`,
    );
  });

  it("URL-encodes id and limit so an id with & or ? adds no query parameter", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json([]));

    await GET(makeRequest("?id=a%26b%3Fc&limit=5%266"));

    const calledUrl = new URL(String(vi.mocked(fetch).mock.calls[0]![0]));
    expect([...calledUrl.searchParams.keys()]).toEqual(["id", "limit"]);
    expect(calledUrl.searchParams.get("id")).toBe("a&b?c");
    expect(calledUrl.searchParams.get("limit")).toBe("5&6");
  });

  it("returns the BFF JSON with a public SWR cache header on success", async () => {
    const items = [{ id: "1", type: "article", title: "Nieuws" }];
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(items));

    const response = await GET(makeRequest("?id=abc&limit=2"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(items);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
  });

  it("returns an uncached [] when the BFF answers non-OK", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ error: "boom" }, { status: 502 }),
    );

    const response = await GET(makeRequest("?id=abc"));

    expect(await response.json()).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("returns an uncached [] and logs when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network down"));

    const response = await GET(makeRequest("?id=abc"));

    expect(await response.json()).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "[related] fetch failed:",
      expect.any(Error),
    );
  });

  it("returns an uncached 503 [] when KCVV_API_URL is unset", async () => {
    vi.stubEnv("KCVV_API_URL", undefined);

    const response = await GET(makeRequest("?id=abc"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
