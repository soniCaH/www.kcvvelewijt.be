import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";
import type { Window as HappyDomWindow } from "happy-dom";
import { TrackInView } from "./TrackInView";

const setViewport = (size: { width: number; height: number }) =>
  (window as unknown as HappyDomWindow).happyDOM.setViewport(size);

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";

const rect = (height: number) => ({ height }) as DOMRectReadOnly;

/** A fake entry on a 667 px tall root; `height` is the intersecting px. */
const entry = (
  intersectionRatio: number,
  height = 0,
  rootBounds: DOMRectReadOnly | null = rect(667),
) => ({
  isIntersecting: true,
  intersectionRatio,
  intersectionRect: rect(height),
  rootBounds,
});

describe("<TrackInView>", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    vi.mocked(trackEvent).mockClear();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    setViewport({ width: 1024, height: 768 });
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
      FakeIntersectionObserver.latest()!.trigger([entry(1)]);
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
      observer.trigger([entry(1)]);
      observer.trigger([entry(1)]);
      observer.trigger([entry(1)]);
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
      FakeIntersectionObserver.latest()!.trigger([entry(0.01)]);
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
      observer.trigger([entry(0.2)]);
      observer.trigger([entry(0.4)]);
      observer.trigger([entry(0.9)]);
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
      FakeIntersectionObserver.latest()!.trigger([entry(0)]);
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("fires a block taller than the viewport once its visible part fills the threshold of the viewport", () => {
    render(
      <TrackInView eventName="x_in_view" threshold={0.4}>
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      // 0.4 x 667 = 266.8 px
      FakeIntersectionObserver.latest()!.trigger([entry(0.17, 300)]);
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("does not fire a tall block whose visible part is below the viewport threshold", () => {
    render(
      <TrackInView eventName="x_in_view" threshold={0.4}>
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      FakeIntersectionObserver.latest()!.trigger([entry(0.17, 200)]);
    });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("falls back to window.innerHeight when rootBounds is null", () => {
    setViewport({ width: 375, height: 500 });
    render(
      <TrackInView eventName="x_in_view" threshold={0.4}>
        <span>child</span>
      </TrackInView>,
    );
    act(() => {
      const observer = FakeIntersectionObserver.latest()!;
      observer.trigger([entry(0.1, 199, null)]);
      expect(trackEvent).not.toHaveBeenCalled();
      observer.trigger([entry(0.1, 200, null)]);
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("observes a list of thresholds below the threshold so tall blocks keep getting callbacks", () => {
    render(
      <TrackInView eventName="x_in_view" threshold={0.4}>
        <span>child</span>
      </TrackInView>,
    );
    const list = FakeIntersectionObserver.latest()!.options!
      .threshold as number[];
    expect(list.some((t) => t > 0 && t < 0.4)).toBe(true);
    expect(list.at(-1)).toBe(0.4);
    expect([...list].sort((a, b) => a - b)).toEqual(list);
    expect(new Set(list).size).toBe(list.length);
  });

  it("observes [0] for threshold 0", () => {
    render(
      <TrackInView eventName="x_in_view" threshold={0}>
        <span>child</span>
      </TrackInView>,
    );
    expect(FakeIntersectionObserver.latest()!.options!.threshold).toEqual([0]);
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
      FakeIntersectionObserver.latest()!.trigger([entry(1)]);
    });
    expect(
      FakeIntersectionObserver.latest()!.disconnect.mock.calls.length,
    ).toBeGreaterThanOrEqual(1);
  });
});
