import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { PageViewTracker } from "./PageViewTracker";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";

describe("<PageViewTracker>", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  it("fires trackEvent on mount with the supplied params", () => {
    render(
      <PageViewTracker
        eventName="player_profile_view"
        params={{ slug: "x" }}
      />,
    );
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("player_profile_view", {
      slug: "x",
    });
  });

  it("renders nothing", () => {
    const { container } = render(<PageViewTracker eventName="x" />);
    expect(container.firstChild).toBeNull();
  });

  it("does not re-fire when params change but eventName stays the same", () => {
    const { rerender } = render(
      <PageViewTracker
        eventName="player_profile_view"
        params={{ slug: "a" }}
      />,
    );
    rerender(
      <PageViewTracker
        eventName="player_profile_view"
        params={{ slug: "b" }}
      />,
    );
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("re-fires when eventName changes (different page)", () => {
    const { rerender } = render(
      <PageViewTracker
        eventName="player_profile_view"
        params={{ slug: "a" }}
      />,
    );
    rerender(
      <PageViewTracker eventName="team_profile_view" params={{ slug: "a" }} />,
    );
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });
});
