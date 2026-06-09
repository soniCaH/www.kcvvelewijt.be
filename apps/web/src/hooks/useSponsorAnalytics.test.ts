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

  it("fires sponsor_cta_click with no params", () => {
    const { result } = renderHook(() => useSponsorAnalytics());
    act(() => result.current.trackSponsorCtaClick());
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_cta_click");
  });
});
