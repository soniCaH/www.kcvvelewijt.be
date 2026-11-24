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
      FakeIntersectionObserver.latest()!.trigger([
        { isIntersecting: true, intersectionRatio: 1 },
      ]);
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
      observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
      observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
      observer.trigger([{ isIntersecting: true, intersectionRatio: 1 }]);
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("does not fire when intersecting below the threshold", () => {
    render(
      <TrackInView eventName="x_in_view" threshold={0.4}>
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      FakeIntersectionObserver.latest()!.trigger([
        { isIntersecting: true, intersectionRatio: 0.01 },
      ]);
    });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("fires exactly once at the threshold after an earlier below-threshold entry", () => {
    render(
      <TrackInView eventName="x_in_view" threshold={0.4}>
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      const observer = FakeIntersectionObserver.latest()!;
      observer.trigger([{ isIntersecting: true, intersectionRatio: 0.2 }]);
      observer.trigger([{ isIntersecting: true, intersectionRatio: 0.4 }]);
      observer.trigger([{ isIntersecting: true, intersectionRatio: 0.9 }]);
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("fires on any intersecting entry when the threshold is 0", () => {
    render(
      <TrackInView eventName="x_in_view" threshold={0}>
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      FakeIntersectionObserver.latest()!.trigger([
        { isIntersecting: true, intersectionRatio: 0 },
      ]);
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
      FakeIntersectionObserver.latest()!.trigger([
        { isIntersecting: true, intersectionRatio: 1 },
      ]);
    });
    expect(
      FakeIntersectionObserver.latest()!.disconnect.mock.calls.length,
    ).toBeGreaterThanOrEqual(1);
  });
});
