import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSemanticSearch } from "./useSemanticSearch";

describe("useSemanticSearch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
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
            type: "responsibilityPath",
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

  it("sets error when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      useSemanticSearch({ type: "responsibility", debounceMs: 0 }),
    );

    act(() => result.current.search("test query"));

    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(result.current.results).toEqual([]);
  });

  it("exposes answer from response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "doc-abc",
            slug: "kantine",
            type: "responsibilityPath",
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
            type: "responsibilityPath",
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
            type: "responsibilityPath",
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

  it("clears results on clear()", () => {
    const { result } = renderHook(() => useSemanticSearch());
    act(() => result.current.clear());
    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
