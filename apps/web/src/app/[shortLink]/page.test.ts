import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `after()` needs a live request scope; collect its callbacks and run them by
// hand, which is what the framework does once the response is sent.
const afterCallbacks = vi.hoisted(() => [] as (() => unknown)[]);
vi.mock("next/server", () => ({
  after: (callback: () => unknown) => afterCallbacks.push(callback),
}));

const findShortLink = vi.hoisted(() => vi.fn());
vi.mock("@/lib/server/short-links", () => ({ findShortLink }));

// `redirect` and `notFound` stay REAL: each throws an error whose `digest`
// carries the HTTP status Next will answer with (`NEXT_REDIRECT;replace;<url>;307;`
// and `NEXT_HTTP_ERROR_FALLBACK;404`), so the assertions below pin the status,
// not just that "something threw".
import ShortLinkPage, * as pageModule from "./page";

const fetchMock = vi.fn();

async function visit(segment: string) {
  try {
    await ShortLinkPage({ params: Promise.resolve({ shortLink: segment }) });
  } catch (error) {
    return (error as { digest?: string }).digest ?? String(error);
  }
  throw new Error("the page neither redirected nor 404ed");
}

const runAfter = () => Promise.all(afterCallbacks.map((cb) => cb()));

beforeEach(() => {
  afterCallbacks.length = 0;
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST123");
  vi.stubEnv("GA4_API_SECRET", "s3cret");
  findShortLink.mockReset().mockImplementation(
    async (segment: string) =>
      ({
        stage: { name: "stage", target: "/nieuws/herfststage-2026" },
        tornooi: {
          name: "tornooi",
          target: "https://www.tournify.nl/live/kcvvelewijt2025",
        },
      })[segment] ?? null,
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("/[shortLink]", () => {
  it("is rendered per request: a cached redirect would never reach after() again", () => {
    expect(pageModule.dynamic).toBe("force-dynamic");
  });

  it("sends a known name to an external target with a 307", async () => {
    expect(await visit("tornooi")).toBe(
      "NEXT_REDIRECT;replace;https://www.tournify.nl/live/kcvvelewijt2025;307;",
    );
  });

  it("sends a known name to an own-site path with a 307", async () => {
    expect(await visit("stage")).toBe(
      "NEXT_REDIRECT;replace;/nieuws/herfststage-2026;307;",
    );
  });

  it("answers an unknown name with the not-found page and a 404 status", async () => {
    expect(await visit("onbekend")).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("counts a known hit once, after the response", async () => {
    await visit("stage");
    expect(fetchMock).not.toHaveBeenCalled();

    await runAfter();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).events).toEqual([
      { name: "short_link_click", params: { short_link_name: "stage" } },
    ]);
  });

  it("counts the stored name when the visitor used other casing", async () => {
    findShortLink.mockResolvedValue({ name: "stage", target: "/nieuws/x" });
    await visit("STAGE");
    await runAfter();
    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body).events[0].params,
    ).toEqual({ short_link_name: "stage" });
  });

  it("counts nothing for an unknown name", async () => {
    await visit("onbekend");
    await runAfter();
    expect(afterCallbacks).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still redirects, and sends nothing, when the GA4 env is missing", async () => {
    vi.stubEnv("GA4_API_SECRET", "");
    expect(await visit("stage")).toBe(
      "NEXT_REDIRECT;replace;/nieuws/herfststage-2026;307;",
    );
    await runAfter();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still redirects with a 307 when the GA4 request is rejected", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    expect(await visit("stage")).toBe(
      "NEXT_REDIRECT;replace;/nieuws/herfststage-2026;307;",
    );
    await expect(runAfter()).resolves.toBeDefined();
  });
});
