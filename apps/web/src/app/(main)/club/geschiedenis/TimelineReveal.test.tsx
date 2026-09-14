import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";
import { TimelineReveal } from "./TimelineReveal";

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function intersect(target: Element): void {
  act(() => {
    FakeIntersectionObserver.latest()!.trigger([
      { isIntersecting: true, target, intersectionRatio: 1 },
    ]);
  });
}

describe("TimelineReveal", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    stubMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders its children", () => {
    render(
      <TimelineReveal>
        <div data-testid="child">Hello</div>
      </TimelineReveal>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("applies the base class and observes every [data-timeline-item]", () => {
    render(
      <TimelineReveal>
        <div data-timeline-item data-side="left" data-testid="a" />
        <figure data-timeline-item data-testid="b" />
        <div data-timeline-item data-side="right" data-testid="c" />
      </TimelineReveal>,
    );

    expect(FakeIntersectionObserver.latest()).not.toBeUndefined();
    expect(FakeIntersectionObserver.latest()!.observe).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId("a").parentElement).toHaveClass(
      "timeline-reveal",
    );
  });

  it("configures the observer (threshold 0.1, rootMargin '0px 0px -10% 0px')", () => {
    render(
      <TimelineReveal>
        <div data-timeline-item />
      </TimelineReveal>,
    );

    expect(FakeIntersectionObserver.latest()?.options?.threshold).toBe(0.1);
    expect(FakeIntersectionObserver.latest()?.options?.rootMargin).toBe(
      "0px 0px -10% 0px",
    );
  });

  it("adds the --entered class on intersection and stops observing", () => {
    render(
      <TimelineReveal>
        <div data-timeline-item data-testid="item" />
      </TimelineReveal>,
    );

    const item = screen.getByTestId("item");
    expect(item).not.toHaveClass("timeline-item--entered");

    intersect(item);

    expect(item).toHaveClass("timeline-item--entered");
    expect(FakeIntersectionObserver.latest()!.unobserve).toHaveBeenCalledWith(
      item,
    );
  });

  it("does not instantiate an observer or apply the base class under reduced motion", () => {
    stubMatchMedia(true);

    render(
      <TimelineReveal>
        <div data-timeline-item data-testid="item" />
      </TimelineReveal>,
    );

    expect(FakeIntersectionObserver.latest()).toBeUndefined();
    expect(screen.getByTestId("item").parentElement).not.toHaveClass(
      "timeline-reveal",
    );
  });
});
