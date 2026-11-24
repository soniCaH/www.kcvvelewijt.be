import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { MatchPracticalAnalytics } from "./MatchPracticalAnalytics";

const mockTrackEvent = vi.mocked(trackEvent);

describe("MatchPracticalAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fires match_practical_click with exactly match_id, status and the href", async () => {
    render(
      <MatchPracticalAnalytics matchId={3602} status="scheduled">
        <a href="/club/contact" data-match-practical>
          <span>Parking</span>
        </a>
      </MatchPracticalAnalytics>,
    );

    await userEvent.click(screen.getByText("Parking"));

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith("match_practical_click", {
      match_id: 3602,
      status: "scheduled",
      destination: "/club/contact",
    });
  });

  it("ignores clicks outside the marked link", async () => {
    render(
      <MatchPracticalAnalytics matchId={3602} status="scheduled">
        <a href="/elsewhere">Elsewhere</a>
      </MatchPracticalAnalytics>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Elsewhere" }));

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
