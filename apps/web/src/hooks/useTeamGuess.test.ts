import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTeamGuess } from "./useTeamGuess";

// A switch that makes the decoder chunk fail to load: reading an export off
// `@/lib/search/search-decoders` throws while it is on.
const decoderChunk = vi.hoisted(() => ({ failing: false }));
vi.mock("@/lib/search/search-decoders", async (importOriginal) => {
  const actual = await importOriginal<object>();
  return new Proxy(actual, {
    get: (target, key) => {
      if (decoderChunk.failing) throw new Error("decoder chunk failed to load");
      return Reflect.get(target, key);
    },
  });
});

const AGES = ["U8", "U9", "U10"];

/** Let the fetch promise chain settle. */
const settle = () => act(() => vi.advanceTimersByTimeAsync(0));

const guessCalls = () =>
  vi
    .mocked(fetch)
    .mock.calls.filter(([url]) => url === "/api/search/team-guess");

describe("useTeamGuess", () => {
  // The hook loads its decoder chunk with a dynamic `import()`; fake timers cannot
  // wait for a first load, so warm the module before any test runs.
  beforeAll(() => import("@/lib/search/search-decoders"));

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ age: "U9" })),
    );
  });

  // Global config has no restoreMocks/clearMocks (apps/web/vitest.config.ts).
  afterEach(() => {
    decoderChunk.failing = false;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns no guess initially, and asks nothing for a null query", async () => {
    const { result } = renderHook(() => useTeamGuess(null, AGES));
    await settle();
    expect(result.current).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks nothing without ages", async () => {
    renderHook(() => useTeamGuess("mijn zoon", []));
    await settle();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks with the query and the ages", async () => {
    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));

    await settle();
    expect(guessCalls()).toHaveLength(1);
    expect(JSON.parse(String(guessCalls()[0][1]?.body))).toEqual({
      query: "mijn zoon",
      ages: AGES,
    });
    expect(result.current).toEqual({ query: "mijn zoon", age: "U9" });
  });

  it("leaves no guess for a 200 whose body is not the contract's (#3878)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ age: "nonsense" }));
    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));

    await settle();
    expect(guessCalls()).toHaveLength(1);
    expect(result.current).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("does not match the contract"),
    );
  });

  it("leaves no guess when the decoder chunk fails to load (#3878)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    decoderChunk.failing = true;
    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));

    await settle();
    expect(result.current).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("team guess failed"),
      expect.any(Error),
    );
  });

  it("aborts the request in flight when the query changes", async () => {
    const first: { signal?: AbortSignal } = {};
    vi.mocked(fetch).mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          first.signal = init?.signal ?? undefined;
          first.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender, result } = renderHook(
      ({ query }: { query: string }) => useTeamGuess(query, AGES),
      { initialProps: { query: "mijn zoon" } },
    );
    await settle();
    rerender({ query: "mijn dochter" });
    await settle();

    expect(first.signal?.aborted).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    expect(result.current).toEqual({ query: "mijn dochter", age: "U9" });
  });

  it("leaves no guess when the AI found none", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ age: null }));
    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));
    await settle();
    expect(guessCalls()).toHaveLength(1);
    expect(result.current).toBeNull();
  });

  it("leaves no guess on a 429, without throwing", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ error: "Too many searches" }, { status: 429 }),
    );
    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));
    await settle();
    expect(result.current).toBeNull();
  });

  it("warns (not errors) on a failed fetch and leaves no guess", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const networkError = new Error("Network error");
    vi.mocked(fetch).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));
    await settle();

    expect(result.current).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("team guess"),
      networkError,
    );
    expect(error).not.toHaveBeenCalled();
  });
});
