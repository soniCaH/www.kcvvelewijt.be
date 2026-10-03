import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSemanticSearch } from "./useSemanticSearch";

describe("useSemanticSearch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // Global config has no restoreMocks/clearMocks (apps/web/vitest.config.ts),
  // so a console spy left un-restored on a failed assertion would otherwise
  // leak into every later test in this file, not just this one.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty results initially", () => {
    const { result } = renderHook(() =>
      useSemanticSearch({ type: "responsibility" }),
    );
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("fetches results after search is called", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "doc-abc",
            slug: "kantine",
            type: "responsibility",
            score: 0.9,
            title: "Kantine",
            excerpt: "De kantine...",
          },
        ],
      }),
    } as Response);

    const { result } = renderHook(() =>
      useSemanticSearch({ type: "responsibility", debounceMs: 0 }),
    );

    act(() => result.current.search("kantine verantwoordelijke"));

    await waitFor(() => expect(result.current.results).toHaveLength(1));

    expect(result.current.results[0]!.slug).toBe("kantine");
  });

  it("sets error when fetch fails, warns (not errors) on the console, and never stores the message", async () => {
    // console.warn, not console.error: both consumers (HubSearch's keyword
    // fallback, useSemanticAugment's silent degrade) treat this as routine
    // degradation, not a real error — a missing KCVV_API_URL 503s this
    // endpoint on every debounced keystroke in local dev and preview.
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const networkError = new Error("Network error");
    vi.mocked(fetch).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() =>
      useSemanticSearch({ type: "responsibility", debounceMs: 0 }),
    );

    act(() => result.current.search("test query"));

    // A strict `toBe(true)`, not `toBeTruthy()` — the old `error: string`
    // contract this narrowed from would also pass a loose truthy check.
    await waitFor(() => expect(result.current.error).toBe(true));

    expect(result.current.results).toEqual([]);
    // The failure flag is a boolean, never the raw fetch/Error message — no
    // consumer renders it, and #2580 rule 6 keeps technical text out of the
    // visitor's view entirely.
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("semantic search"),
      networkError,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("exposes answer from response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "doc-abc",
            slug: "kantine",
            type: "responsibility",
            score: 0.9,
            title: "Kantine",
            excerpt: "De kantine...",
          },
        ],
        answer: "De kantine wordt beheerd door de kantineverantwoordelijke.",
      }),
    } as Response);

    const { result } = renderHook(() =>
      useSemanticSearch({ type: "responsibility", debounceMs: 0 }),
    );

    act(() => result.current.search("kantine"));

    await waitFor(() => expect(result.current.results).toHaveLength(1));

    expect(result.current.answer).toBe(
      "De kantine wordt beheerd door de kantineverantwoordelijke.",
    );
  });

  it("answer is undefined when not in response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "doc-abc",
            slug: "kantine",
            type: "responsibility",
            score: 0.4,
            title: "Kantine",
            excerpt: "De kantine...",
          },
        ],
      }),
    } as Response);

    const { result } = renderHook(() =>
      useSemanticSearch({ type: "responsibility", debounceMs: 0 }),
    );

    act(() => result.current.search("vage vraag"));

    await waitFor(() => expect(result.current.results).toHaveLength(1));

    expect(result.current.answer).toBeUndefined();
  });

  it("clears answer on clear()", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "doc-abc",
            slug: "kantine",
            type: "responsibility",
            score: 0.9,
            title: "Kantine",
            excerpt: "De kantine...",
          },
        ],
        answer: "Een antwoord.",
      }),
    } as Response);

    const { result } = renderHook(() =>
      useSemanticSearch({ type: "responsibility", debounceMs: 0 }),
    );

    act(() => result.current.search("kantine"));
    await waitFor(() => expect(result.current.answer).toBe("Een antwoord."));

    act(() => result.current.clear());
    expect(result.current.answer).toBeUndefined();
  });

  it("keeps the last answer while a new query is pending, then replaces it", async () => {
    const hit = {
      id: "doc-abc",
      slug: "kantine",
      type: "responsibility",
      score: 0.9,
      title: "Kantine",
      excerpt: "De kantine...",
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [hit], answer: "Eerste." }),
    } as Response);

    const { result } = renderHook(() =>
      useSemanticSearch({ type: "responsibility", debounceMs: 0 }),
    );
    act(() => result.current.search("kantine"));
    await waitFor(() => expect(result.current.answer).toBe("Eerste."));

    // A re-search in flight: the old answer (and results) are still held.
    let resolveSecond!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveSecond = resolve;
      }),
    );
    act(() => result.current.search("kantine open"));
    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.answer).toBe("Eerste.");
    expect(result.current.results).toHaveLength(1);
    expect(result.current.executedQuery).toBe("kantine");

    await act(async () => {
      resolveSecond({
        ok: true,
        json: async () => ({ results: [hit], answer: "Tweede." }),
      } as Response);
    });
    await waitFor(() => expect(result.current.answer).toBe("Tweede."));
  });

  it("clears results on clear()", () => {
    const { result } = renderHook(() => useSemanticSearch());
    act(() => result.current.clear());
    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBe(false);
  });
});
