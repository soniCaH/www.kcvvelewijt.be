import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { useResponsibilityAnalytics } from "./useResponsibilityAnalytics";

const mockTrackEvent = vi.mocked(trackEvent);

describe("useResponsibilityAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("responsibility_role_selected", () => {
    it("fires when a role is selected", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.trackRoleSelected("speler");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "responsibility_role_selected",
        { role: "speler" },
      );
    });
  });

  describe("responsibility_search", () => {
    it("fires with query length, role, and results count", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.trackSearch("blessure", "speler", 3);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("responsibility_search", {
        query_length: 8,
        role: "speler",
        results_count: 3,
      });
    });
  });

  describe("responsibility_no_results", () => {
    it("fires with query length and role", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.trackNoResults(3, "ouder");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("responsibility_no_results", {
        query_length: 3,
        role: "ouder",
      });
    });
  });

  describe("responsibility_suggestion_clicked", () => {
    it("fires with path_id, category, and 1-indexed position", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.trackSuggestionClicked("herstel-blessure", "medisch", 0);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "responsibility_suggestion_clicked",
        { path_id: "herstel-blessure", category: "medisch", position: 1 },
      );
    });
  });

  describe("responsibility_contact_clicked", () => {
    it("fires with path_id and contact_type for email", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.trackContactClicked("herstel-blessure", "email");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "responsibility_contact_clicked",
        { path_id: "herstel-blessure", contact_type: "email" },
      );
    });

    it("fires with path_id and contact_type for phone", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.trackContactClicked("herstel-blessure", "phone");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "responsibility_contact_clicked",
        { path_id: "herstel-blessure", contact_type: "phone" },
      );
    });
  });

  describe("responsibility_organigram_link", () => {
    it("fires with path_id and member_id", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.trackOrganigramLink("herstel-blessure", "kinesist");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "responsibility_organigram_link",
        { path_id: "herstel-blessure", member_id: "kinesist" },
      );
    });
  });

  describe("responsibility_step_link_clicked", () => {
    it("fires with path_id and step_index", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.trackStepLinkClicked("herstel-blessure", 2);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "responsibility_step_link_clicked",
        { path_id: "herstel-blessure", step_index: 2 },
      );
    });
  });

  describe("responsibility_dwell", () => {
    it("fires at 5s, 15s, and 30s thresholds", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.startDwell("herstel-blessure", "medisch");
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(mockTrackEvent).toHaveBeenCalledWith("responsibility_dwell", {
        path_id: "herstel-blessure",
        dwell_seconds: 5,
        category: "medisch",
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(mockTrackEvent).toHaveBeenCalledWith("responsibility_dwell", {
        path_id: "herstel-blessure",
        dwell_seconds: 15,
        category: "medisch",
      });

      act(() => {
        vi.advanceTimersByTime(15000);
      });
      expect(mockTrackEvent).toHaveBeenCalledWith("responsibility_dwell", {
        path_id: "herstel-blessure",
        dwell_seconds: 30,
        category: "medisch",
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(3);
    });

    it("cleans up timers on stopDwell", () => {
      const { result } = renderHook(() => useResponsibilityAnalytics());

      act(() => {
        result.current.startDwell("herstel-blessure", "medisch");
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.stopDwell();
      });

      act(() => {
        vi.advanceTimersByTime(25000);
      });
      // No more events after stop
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("responsibility_abandon", () => {
    it("fires on unmount when no contact interaction occurred", () => {
      const { result, unmount } = renderHook(() =>
        useResponsibilityAnalytics(),
      );

      // User searched but never clicked contact
      act(() => {
        result.current.trackRoleSelected("speler");
        result.current.trackSearch("blessure", "speler", 3);
      });

      mockTrackEvent.mockClear();

      unmount();

      expect(mockTrackEvent).toHaveBeenCalledWith("responsibility_abandon", {
        role: "speler",
        query_length: 8,
        had_results: true,
      });
    });

    it("does not fire on unmount when contact was clicked", () => {
      const { result, unmount } = renderHook(() =>
        useResponsibilityAnalytics(),
      );

      act(() => {
        result.current.trackRoleSelected("speler");
        result.current.trackSearch("blessure", "speler", 3);
        result.current.trackContactClicked("herstel-blessure", "email");
      });

      mockTrackEvent.mockClear();

      unmount();

      expect(mockTrackEvent).not.toHaveBeenCalledWith(
        "responsibility_abandon",
        expect.anything(),
      );
    });

    it("does not fire when no role was selected", () => {
      const { unmount } = renderHook(() => useResponsibilityAnalytics());

      mockTrackEvent.mockClear();

      unmount();

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });
});
