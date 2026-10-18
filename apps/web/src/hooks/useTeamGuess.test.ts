import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTeamGuess } from "./useTeamGuess";
import { SEMANTIC_SEARCH_DEBOUNCE_MS } from "./useSemanticSearch";

const AGES = ["U8", "U9", "U10"];

/** Past the debounce, then let the fetch promise chain settle. */
const pastDebounce = () =>
  act(() => vi.advanceTimersByTimeAsync(SEMANTIC_SEARCH_DEBOUNCE_MS));

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
    await pastDebounce();
    expect(result.current).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks nothing without ages", async () => {
    renderHook(() => useTeamGuess("mijn zoon", []));
    await pastDebounce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks with the query and the ages after the semantic-search debounce", async () => {
    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));

    await act(() =>
      vi.advanceTimersByTimeAsync(SEMANTIC_SEARCH_DEBOUNCE_MS - 1),
    );
    expect(fetch).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(guessCalls()).toHaveLength(1);
    expect(JSON.parse(String(guessCalls()[0][1]?.body))).toEqual({
      query: "mijn zoon",
      ages: AGES,
    });
    expect(result.current).toEqual({ query: "mijn zoon", age: "U9" });
  });

  it("asks once for the last query when it changes inside the debounce", async () => {
    const { rerender } = renderHook(
      ({ query }: { query: string }) => useTeamGuess(query, AGES),
      { initialProps: { query: "mijn" } },
    );
    await act(() => vi.advanceTimersByTimeAsync(100));
    rerender({ query: "mijn zoon" });
    await pastDebounce();

    expect(guessCalls()).toHaveLength(1);
    expect(JSON.parse(String(guessCalls()[0][1]?.body)).query).toBe(
      "mijn zoon",
    );
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
    await pastDebounce();
    rerender({ query: "mijn dochter" });
    await pastDebounce();

    expect(firstSignal?.aborted).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    expect(result.current).toEqual({ query: "mijn dochter", age: "U9" });
  });

  it("leaves no guess when the AI found none", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ age: null }));
    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));
    await pastDebounce();
    expect(guessCalls()).toHaveLength(1);
    expect(result.current).toBeNull();
  });

  it("leaves no guess on a 429, without throwing", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ error: "Too many searches" }, { status: 429 }),
    );
    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));
    await pastDebounce();
    expect(result.current).toBeNull();
  });

  it("warns (not errors) on a failed fetch and leaves no guess", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const networkError = new Error("Network error");
    vi.mocked(fetch).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useTeamGuess("mijn zoon", AGES));
    await pastDebounce();

    expect(result.current).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("team guess"),
      networkError,
    );
    expect(error).not.toHaveBeenCalled();
  });

  it("asks nothing after unmount inside the debounce", async () => {
    const { unmount } = renderHook(() => useTeamGuess("mijn zoon", AGES));
    unmount();
    await pastDebounce();
    expect(fetch).not.toHaveBeenCalled();
  });
});
