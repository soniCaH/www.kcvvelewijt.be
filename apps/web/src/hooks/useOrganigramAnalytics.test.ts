import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { useOrganigramAnalytics, hashMemberId } from "./useOrganigramAnalytics";

const mockTrackEvent = vi.mocked(trackEvent);

describe("useOrganigramAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("organigram_view_changed", () => {
    it("fires with view and source when tab is clicked", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      act(() => {
        result.current.trackViewChanged("chart", "tab");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_view_changed", {
        view: "chart",
        source: "tab",
      });
    });

    it("fires with source swipe when view is changed via swipe", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      act(() => {
        result.current.trackViewChanged("cards", "swipe");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_view_changed", {
        view: "cards",
        source: "swipe",
      });
    });

    it("fires with source keyboard when view is changed via keyboard", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      act(() => {
        result.current.trackViewChanged("responsibilities", "keyboard");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_view_changed", {
        view: "responsibilities",
        source: "keyboard",
      });
    });
  });

  describe("organigram_member_clicked", () => {
    it("fires with hashed member_id and current view", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      act(() => {
        result.current.trackMemberClicked("voorzitter-id", "chart");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_member_clicked", {
        member_id: hashMemberId("voorzitter-id"),
        view: "chart",
      });
    });

    it("fires with hashed member_id and cards view", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      act(() => {
        result.current.trackMemberClicked("secretaris-id", "cards");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_member_clicked", {
        member_id: hashMemberId("secretaris-id"),
        view: "cards",
      });
    });
  });

  describe("organigram_search_used", () => {
    it("fires with sanitized query_text when user searches", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      act(() => {
        result.current.trackSearchUsed("JAN");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_search_used", {
        query_text: "jan",
      });
    });

    it("truncates query_text to 50 characters", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());
      const longQuery = "a".repeat(60);

      act(() => {
        result.current.trackSearchUsed(longQuery);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_search_used", {
        query_text: "a".repeat(50),
      });
    });
  });

  describe("organigram_department_filtered", () => {
    it("fires with department when filter is changed", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      act(() => {
        result.current.trackDepartmentFiltered("jeugdbestuur");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "organigram_department_filtered",
        { department: "jeugdbestuur" },
      );
    });

    it("fires with 'all' when all departments selected", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      act(() => {
        result.current.trackDepartmentFiltered("all");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "organigram_department_filtered",
        { department: "all" },
      );
    });
  });

  describe("organigram_export_png", () => {
    it("fires with no parameters when chart is exported", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      act(() => {
        result.current.trackExportPng();
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "organigram_export_png",
        undefined,
      );
    });
  });
});
