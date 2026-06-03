import { StrictMode } from "react";
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

  it("fires only once under StrictMode (the ref guard absorbs the effect double-invoke)", () => {
    // StrictMode double-invokes effects in dev (setup → cleanup → setup) on the
    // same instance, so the `hasFired` ref persists — without the guard this
    // would fire twice.
    render(
      <StrictMode>
        <EventViewTracker eventSlug="mosselfeest" eventType="Clubevent" />
      </StrictMode>,
    );
    expect(trackEventMock).toHaveBeenCalledTimes(1);
  });
});
