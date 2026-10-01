// @vitest-environment node
/**
 * `fetchFresh` (#3317) — the Typekit prefetch's network half. A fresh CI
 * runner has no cache to fall back to, so a single slow Typekit response used
 * to fail a whole VR shard (#3316). It now retries before giving up.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FETCH_ATTEMPTS, fetchFresh } from "../../scripts/prefetch-typekit.mjs";

const URL = "https://use.typekit.net/cvo5raz.css";
const ok = (body: string) => new Response(body, { status: 200 });

describe("fetchFresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the body of a fetch that fails once and then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("The operation was aborted due to timeout"),
      )
      .mockResolvedValueOnce(ok("css"));
    vi.stubGlobal("fetch", fetchMock);

    const result = fetchFresh(URL, false);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe("css");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(`${URL} attempt 1/`),
    );
  });

  it("counts a non-2xx response as a failed attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(ok("css"));
    vi.stubGlobal("fetch", fetchMock);

    const result = fetchFresh(URL, false);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe("css");
  });

  it("returns a Buffer when asked for one", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok("woff2")));

    const body = await fetchFresh(URL, true);

    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body.toString()).toBe("woff2");
  });

  it("throws the last error after every attempt fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const result = fetchFresh(URL, false);
    const assertion = expect(result).rejects.toThrow("network down");
    await vi.runAllTimersAsync();

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(FETCH_ATTEMPTS);
  });
});
