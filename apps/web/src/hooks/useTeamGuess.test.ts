import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTeamGuess } from "./useTeamGuess";

const AGES = ["U8", "U9", "U10"];

/** Let the fetch promise chain settle. */
const settle = () => act(() => vi.advanceTimersByTimeAsync(0));

const guessCalls = () =>
  vi
    .mocked(fetch)
    .mock.calls.filter(([url]) => url === "/api/search/team-guess");

describe("useTeamGuess", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ age: "U9" })),
    );
  });

  // Global config has no restoreMocks/clearMocks (apps/web/vitest.config.ts).
  afterEach(() => {
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

  it("aborts the request in flight when the query changes", async () => {
    let firstSignal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          firstSignal = init?.signal ?? undefined;
          firstSignal?.addEventListener("abort", () =>
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

    expect(firstSignal?.aborted).toBe(true);
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
