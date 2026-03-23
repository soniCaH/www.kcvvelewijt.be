import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRelatedContent } from "./useRelatedContent";

describe("useRelatedContent", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns empty results when sanityId is null", () => {
    const { result } = renderHook(() => useRelatedContent(null));
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("fetches related results for a valid sanityId", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "doc-def",
          slug: "blessure-melden",
          type: "responsibilityPath",
          score: 0.85,
          title: "Blessure melden",
          excerpt: "Hoe meld je...",
        },
      ],
    } as Response);

    const { result } = renderHook(() => useRelatedContent("doc-abc"));

    await waitFor(() => expect(result.current.results).toHaveLength(1));

    expect(result.current.results[0]!.slug).toBe("blessure-melden");
    expect(fetch).toHaveBeenCalledWith(
      "/api/related?id=doc-abc&limit=3",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("returns empty results on fetch error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRelatedContent("doc-abc"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toEqual([]);
  });

  it("aborts in-flight fetch on cleanup", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // never resolves

    const { unmount } = renderHook(() => useRelatedContent("doc-abc"));
    unmount();

    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });
});
