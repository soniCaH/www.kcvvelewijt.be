import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { useSearchAnalytics } from "./useSearchAnalytics";

const mockTrackEvent = vi.mocked(trackEvent);

describe("useSearchAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("search_submitted", () => {
    it("fires with sanitized query_text and query_length on submit", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackSearchSubmitted("KCVV Elewijt");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("search_submitted", {
        query_text: "kcvv elewijt",
        query_length: 12,
      });
    });

    it("truncates query_text to 50 characters", () => {
      const { result } = renderHook(() => useSearchAnalytics());
      const longQuery = "a".repeat(80);

      act(() => {
        result.current.trackSearchSubmitted(longQuery);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("search_submitted", {
        query_text: "a".repeat(50),
        query_length: 80,
      });
    });
  });

  describe("search_results_shown", () => {
    it("fires with results_count and sanitized query_text", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackResultsShown(5, "Spelers");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("search_results_shown", {
        results_count: 5,
        query_text: "spelers",
      });
    });
  });

  describe("search_no_results", () => {
    it("fires with sanitized query_text and query_length", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackNoResults("xyznonexistent");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("search_no_results", {
        query_text: "xyznonexistent",
        query_length: 14,
      });
    });
  });

  describe("search_filter_changed", () => {
    it("fires with filter_type", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackFilterChanged("article");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("search_filter_changed", {
        filter_type: "article",
      });
    });

    it("fires with 'all' filter_type", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackFilterChanged("all");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("search_filter_changed", {
        filter_type: "all",
      });
    });
  });

  describe("search_result_clicked", () => {
    it("fires with result_type, result_title, and 1-indexed position", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackResultClicked("article", "Nieuw seizoen", 0);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("search_result_clicked", {
        result_type: "article",
        result_title: "Nieuw seizoen",
        position: 1,
      });
    });

    it("converts 0-indexed to 1-indexed position", () => {
      const { result } = renderHook(() => useSearchAnalytics());

      act(() => {
        result.current.trackResultClicked("player", "Jan Janssen", 4);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("search_result_clicked", {
        result_type: "player",
        result_title: "Jan Janssen",
        position: 5,
      });
    });
  });
});
