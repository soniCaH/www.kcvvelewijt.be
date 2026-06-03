import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventViewTracker } from "./EventViewTracker";

const trackEventMock = vi.fn();
vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

describe("EventViewTracker", () => {
  beforeEach(() => trackEventMock.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("fires event_view once with event_slug + event_type", () => {
    render(<EventViewTracker eventSlug="mosselfeest" eventType="Clubevent" />);
    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith("event_view", {
      event_slug: "mosselfeest",
      event_type: "Clubevent",
    });
  });

  it("falls back to 'Andere' when eventType is null", () => {
    render(<EventViewTracker eventSlug="iets" eventType={null} />);
    expect(trackEventMock).toHaveBeenCalledWith("event_view", {
      event_slug: "iets",
      event_type: "Andere",
    });
  });

  it("does not double-fire on a StrictMode-style remount of the same effect", () => {
    const { rerender } = render(
      <EventViewTracker eventSlug="mosselfeest" eventType="Clubevent" />,
    );
    rerender(
      <EventViewTracker eventSlug="mosselfeest" eventType="Clubevent" />,
    );
    expect(trackEventMock).toHaveBeenCalledTimes(1);
  });
});
