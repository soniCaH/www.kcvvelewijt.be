import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { useVideoAnalytics } from "./useVideoAnalytics";

const mockTrackEvent = vi.mocked(trackEvent);

describe("useVideoAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("article_video_play", () => {
    it("fires with article_slug, video_source=upload, video_provider=native, video_position", () => {
      const { result } = renderHook(() => useVideoAnalytics());

      act(() => {
        result.current.trackVideoPlay({
          articleSlug: "kcvv-vs-boechout",
          videoSource: "upload",
          videoProvider: "native",
          videoPosition: 1,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("article_video_play", {
        article_slug: "kcvv-vs-boechout",
        video_source: "upload",
        video_provider: "native",
        video_position: 1,
      });
    });

    it("fires with video_source=embed, video_provider=youtube for embedded YouTube videos", () => {
      const { result } = renderHook(() => useVideoAnalytics());

      act(() => {
        result.current.trackVideoPlay({
          articleSlug: "trainer-interview",
          videoSource: "embed",
          videoProvider: "youtube",
          videoPosition: 2,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("article_video_play", {
        article_slug: "trainer-interview",
        video_source: "embed",
        video_provider: "youtube",
        video_position: 2,
      });
    });

    it("fires with video_source=embed, video_provider=vimeo for embedded Vimeo videos", () => {
      const { result } = renderHook(() => useVideoAnalytics());

      act(() => {
        result.current.trackVideoPlay({
          articleSlug: "highlights",
          videoSource: "embed",
          videoProvider: "vimeo",
          videoPosition: 1,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("article_video_play", {
        article_slug: "highlights",
        video_source: "embed",
        video_provider: "vimeo",
        video_position: 1,
      });
    });

    it("emits no IDs and no filenames in the event payload (PII guard)", () => {
      const { result } = renderHook(() => useVideoAnalytics());

      act(() => {
        result.current.trackVideoPlay({
          articleSlug: "highlights",
          videoSource: "upload",
          videoProvider: "native",
          videoPosition: 1,
        });
      });

      const [, params] = mockTrackEvent.mock.calls[0] ?? [];
      const keys = Object.keys(params ?? {});
      expect(keys).toEqual(
        expect.arrayContaining([
          "article_slug",
          "video_source",
          "video_provider",
          "video_position",
        ]),
      );
      // No raw IDs, hashed IDs, filenames, or other identifiers leak into
      // the wire payload — slug is the only article-level identifier.
      expect(keys).not.toContain("article_id");
      expect(keys).not.toContain("article_id_hashed");
      expect(keys).not.toContain("video_id");
      expect(keys).not.toContain("video_filename");
      expect(keys).not.toContain("file_name");
      expect(keys).not.toContain("original_filename");
    });

    it("dedup guard: multiple play calls fire trackEvent once with the FIRST call's payload", () => {
      // Distinct payloads per call so the assertion verifies that the
      // dedup guard preserves the *first* call's params — catches a
      // hypothetical regression where a later call could overwrite the
      // captured payload before emit.
      const { result } = renderHook(() => useVideoAnalytics());

      act(() => {
        result.current.trackVideoPlay({
          articleSlug: "kcvv-vs-boechout",
          videoSource: "upload",
          videoProvider: "native",
          videoPosition: 1,
        });
        result.current.trackVideoPlay({
          articleSlug: "trainer-interview",
          videoSource: "embed",
          videoProvider: "youtube",
          videoPosition: 2,
        });
        result.current.trackVideoPlay({
          articleSlug: "highlights",
          videoSource: "embed",
          videoProvider: "vimeo",
          videoPosition: 3,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith("article_video_play", {
        article_slug: "kcvv-vs-boechout",
        video_source: "upload",
        video_provider: "native",
        video_position: 1,
      });
    });
  });

  describe("article_video_complete", () => {
    it("fires with the same parameter shape as play (upload path only by design)", () => {
      const { result } = renderHook(() => useVideoAnalytics());

      act(() => {
        result.current.trackVideoComplete({
          articleSlug: "kcvv-vs-boechout",
          videoSource: "upload",
          videoProvider: "native",
          videoPosition: 1,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("article_video_complete", {
        article_slug: "kcvv-vs-boechout",
        video_source: "upload",
        video_provider: "native",
        video_position: 1,
      });
    });

    it("complete is not blocked by the play dedup guard (independent counters)", () => {
      const { result } = renderHook(() => useVideoAnalytics());

      act(() => {
        result.current.trackVideoPlay({
          articleSlug: "highlights",
          videoSource: "upload",
          videoProvider: "native",
          videoPosition: 1,
        });
        result.current.trackVideoPlay({
          articleSlug: "highlights",
          videoSource: "upload",
          videoProvider: "native",
          videoPosition: 1,
        });
        result.current.trackVideoComplete({
          articleSlug: "highlights",
          videoSource: "upload",
          videoProvider: "native",
          videoPosition: 1,
        });
      });

      // 1 play (deduped from 2) + 1 complete = 2 total
      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(
        1,
        "article_video_play",
        expect.any(Object),
      );
      expect(mockTrackEvent).toHaveBeenNthCalledWith(
        2,
        "article_video_complete",
        expect.any(Object),
      );
    });
  });
});
