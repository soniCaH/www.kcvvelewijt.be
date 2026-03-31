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
    it("single member node: fires with hashed staffMember ID (members[0].id), not the node ID", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      const singleNode = {
        id: "organigramNode-abc",
        title: "Voorzitter",
        members: [{ id: "staffMember-jan", name: "Jan Janssen" }],
      };

      act(() => {
        result.current.trackMemberClicked(singleNode, "chart");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_member_clicked", {
        member_id: hashMemberId("staffMember-jan"),
        view: "chart",
      });
    });

    it("vacant node: fires without member_id when node has no members", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      const vacantNode = {
        id: "organigramNode-vacant",
        title: "Penningmeester",
        members: [],
      };

      act(() => {
        result.current.trackMemberClicked(vacantNode, "cards");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_member_clicked", {
        view: "cards",
      });
    });

    it("shared node: fires with hashed first member ID (members[0].id)", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      // Shared node: 2+ members hold the same position
      // Decision: track members[0].id — the first listed member is the primary contact.
      // A future enhancement could track all member IDs if per-member click tracking is needed.
      const sharedNode = {
        id: "organigramNode-shared",
        title: "Co-Penningmeester",
        members: [
          { id: "staffMember-piet", name: "Piet Pieters" },
          { id: "staffMember-els", name: "Els Elsman" },
        ],
      };

      act(() => {
        result.current.trackMemberClicked(sharedNode, "chart");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("organigram_member_clicked", {
        member_id: hashMemberId("staffMember-piet"),
        view: "chart",
      });
    });

    it("never sends raw organigramNode._id as member_id", () => {
      const { result } = renderHook(() => useOrganigramAnalytics());

      const node = {
        id: "organigramNode-xyz",
        title: "Secretaris",
        members: [{ id: "staffMember-kaat", name: "Kaat Kaatsen" }],
      };

      act(() => {
        result.current.trackMemberClicked(node, "cards");
      });

      const call = mockTrackEvent.mock.calls[0];
      const params = call[1] as Record<string, unknown>;
      // The hashed member_id must NOT be the hash of the node ID
      expect(params.member_id).not.toBe(hashMemberId("organigramNode-xyz"));
      // It must be the hash of the staffMember ID
      expect(params.member_id).toBe(hashMemberId("staffMember-kaat"));
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
