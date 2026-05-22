import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { TrackInView } from "./TrackInView";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";

type IOEntry = Pick<IntersectionObserverEntry, "isIntersecting">;

let observerCallbacks: Array<(entries: IOEntry[]) => void> = [];
let observeCount = 0;
let disconnectCount = 0;

class FakeIntersectionObserver {
  private cb: (entries: IOEntry[]) => void;
  constructor(cb: (entries: IOEntry[]) => void) {
    this.cb = cb;
    observerCallbacks.push(cb);
  }
  observe() {
    observeCount += 1;
  }
  disconnect() {
    disconnectCount += 1;
  }
  unobserve() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
}

describe("<TrackInView>", () => {
  beforeEach(() => {
    observerCallbacks = [];
    observeCount = 0;
    disconnectCount = 0;
    vi.mocked(trackEvent).mockClear();
    (
      globalThis as unknown as { IntersectionObserver: unknown }
    ).IntersectionObserver = FakeIntersectionObserver;
  });

  afterEach(() => {
    delete (globalThis as unknown as { IntersectionObserver?: unknown })
      .IntersectionObserver;
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
    expect(observeCount).toBe(1);
  });

  it("fires trackEvent once when the section becomes visible", () => {
    render(
      <TrackInView eventName="x_in_view" params={{ slug: "foo" }}>
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      observerCallbacks[0]?.([{ isIntersecting: true }]);
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
      observerCallbacks[0]?.([{ isIntersecting: true }]);
      observerCallbacks[0]?.([{ isIntersecting: true }]);
      observerCallbacks[0]?.([{ isIntersecting: true }]);
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
      observerCallbacks[0]?.([{ isIntersecting: false }]);
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
      observerCallbacks[0]?.([{ isIntersecting: true }]);
    });
    expect(disconnectCount).toBeGreaterThanOrEqual(1);
  });
});
