import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";
import { TrackInView } from "./TrackInView";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";

describe("<TrackInView>", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    vi.mocked(trackEvent).mockClear();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders children inside a wrapper carrying the event name", () => {
    const { getByText, container } = render(
      <TrackInView eventName="x_in_view">
        <span>child</span>
      </TrackInView>,
    );
    expect(getByText("child")).toBeInTheDocument();
    expect(container.firstElementChild?.getAttribute("data-track-event")).toBe(
      "x_in_view",
    );
  });

  it("observes its wrapper on mount", () => {
    render(
      <TrackInView eventName="x_in_view">
        <span>child</span>
      </TrackInView>,
    );
    expect(FakeIntersectionObserver.latest()!.observe).toHaveBeenCalledTimes(1);
  });

  it("fires trackEvent once when the section becomes visible", () => {
    render(
      <TrackInView eventName="x_in_view" params={{ slug: "foo" }}>
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      FakeIntersectionObserver.latest()!.trigger([{ isIntersecting: true }]);
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("x_in_view", { slug: "foo" });
  });

  it("does not re-fire if the section becomes visible again", () => {
    render(
      <TrackInView eventName="x_in_view">
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      const observer = FakeIntersectionObserver.latest()!;
      observer.trigger([{ isIntersecting: true }]);
      observer.trigger([{ isIntersecting: true }]);
      observer.trigger([{ isIntersecting: true }]);
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("does not fire while the section is still off-screen", () => {
    render(
      <TrackInView eventName="x_in_view">
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      FakeIntersectionObserver.latest()!.trigger([{ isIntersecting: false }]);
    });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("disconnects the observer after firing", () => {
    render(
      <TrackInView eventName="x_in_view">
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      FakeIntersectionObserver.latest()!.trigger([{ isIntersecting: true }]);
    });
    expect(
      FakeIntersectionObserver.latest()!.disconnect.mock.calls.length,
    ).toBeGreaterThanOrEqual(1);
  });
});
