import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { hashMemberId } from "@/lib/analytics/hash-member-id";
import { useSponsorAnalytics } from "./useSponsorAnalytics";

const mockTrackEvent = vi.mocked(trackEvent);

describe("useSponsorAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fires sponsor_view with no params", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() => result.current.trackSponsorView());
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_view");
  });

  it("fires sponsor_click with a hashed id and tier", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() =>
      result.current.trackSponsorClick({
        sponsorId: "abc-123",
        tier: "sponsor",
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_click", {
      sponsor_id: hashMemberId("abc-123"),
      tier: "sponsor",
    });
  });

  it("fires sponsor_team_line_click with the hashed id and the team slug, no tier or source", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() =>
      result.current.trackSponsorTeamLineClick({
        sponsorId: "abc-123",
        teamSlug: "u15",
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_team_line_click", {
      sponsor_id: hashMemberId("abc-123"),
      team_slug: "u15",
    });
  });

  it("never sends the raw sponsor id", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() =>
      result.current.trackSponsorClick({
        sponsorId: "raw-secret-id",
        tier: "hoofdsponsor",
      }),
    );
    const params = mockTrackEvent.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(params.sponsor_id).not.toBe("raw-secret-id");
    expect(params.sponsor_id).toBe(hashMemberId("raw-secret-id"));
  });

  it("carries source when the tile sat on the homepage", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() =>
      result.current.trackSponsorClick({
        sponsorId: "hp-1",
        tier: "hoofdsponsor",
        source: "homepage",
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_click", {
      sponsor_id: hashMemberId("hp-1"),
      tier: "hoofdsponsor",
      source: "homepage",
    });
  });

  it("carries the sponsors surface on a /sponsors click", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() =>
      result.current.trackSponsorClick({
        sponsorId: "sp-1",
        source: "sponsors",
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_click", {
      sponsor_id: hashMemberId("sp-1"),
      source: "sponsors",
    });
  });

  it("omits tier when absent", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() => result.current.trackSponsorClick({ sponsorId: "x" }));
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_click", {
      sponsor_id: hashMemberId("x"),
    });
  });

  it("fires sponsor_featured_click with a hashed id and tier", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() =>
      result.current.trackSponsorFeaturedClick({
        sponsorId: "feat-1",
        tier: "hoofdsponsor",
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_featured_click", {
      sponsor_id: hashMemberId("feat-1"),
      tier: "hoofdsponsor",
    });
  });

  it("carries the surface on sponsor_featured_click", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() =>
      result.current.trackSponsorFeaturedClick({
        sponsorId: "feat-1",
        source: "sponsors",
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_featured_click", {
      sponsor_id: hashMemberId("feat-1"),
      source: "sponsors",
    });
  });

  it("fires sponsor_impression with a hashed id, tier and source, never the raw id", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() =>
      result.current.trackSponsorImpression({
        sponsorId: "imp-1",
        tier: "sympathisant",
        source: "homepage",
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_impression", {
      sponsor_id: hashMemberId("imp-1"),
      tier: "sympathisant",
      source: "homepage",
    });
    expect(JSON.stringify(mockTrackEvent.mock.calls)).not.toContain("imp-1");
  });

  it("fires sponsor_cta_click with no params", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() => result.current.trackSponsorCtaClick());
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_cta_click");
  });

  it("fires sponsor_contact_click with no params", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() => result.current.trackSponsorContactClick());
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_contact_click");
  });
});
