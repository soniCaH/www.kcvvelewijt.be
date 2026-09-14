import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";
import { SectionWipeReveal } from "./SectionWipeReveal";

const RUN_CLASS = "section-wipe-reveal--run";

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

/** Below the fold — top past the viewport, so the "already visible" check
 * is false and the component arms an observer. */
function mockOffscreenRect(): void {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 2000,
    bottom: 2100,
    left: 0,
    right: 0,
    width: 0,
    height: 100,
    x: 0,
    y: 2000,
    toJSON: () => ({}),
  });
}

/** Inside the viewport at mount. */
function mockOnscreenRect(): void {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 100,
    bottom: 300,
    left: 0,
    right: 0,
    width: 0,
    height: 200,
    x: 0,
    y: 100,
    toJSON: () => ({}),
  });
}

/** Scrolled PAST — bottom at/above the viewport top, e.g. a back-navigation
 * that restores scroll to the foot of the page. */
function mockScrolledPastRect(): void {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: -300,
    bottom: -100,
    left: 0,
    right: 0,
    width: 0,
    height: 200,
    x: 0,
    y: -300,
    toJSON: () => ({}),
  });
}

describe("SectionWipeReveal", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    stubMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    mockOffscreenRect();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders its children", () => {
    render(
      <SectionWipeReveal>
        <p data-testid="child">Hello</p>
      </SectionWipeReveal>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("observes the container when it is not already visible at mount", () => {
    render(
      <SectionWipeReveal>
        <p>Content</p>
      </SectionWipeReveal>,
    );
    expect(FakeIntersectionObserver.latest()).not.toBeUndefined();
    expect(FakeIntersectionObserver.latest()!.observe).toHaveBeenCalledTimes(1);
  });

  it("configures the observer with threshold 0.1 and rootMargin '0px 0px -10% 0px'", () => {
    render(
      <SectionWipeReveal>
        <p>Content</p>
      </SectionWipeReveal>,
    );
    expect(FakeIntersectionObserver.latest()?.options?.threshold).toBe(0.1);
    expect(FakeIntersectionObserver.latest()?.options?.rootMargin).toBe(
      "0px 0px -10% 0px",
    );
  });

  it("adds the --run class when the section intersects, and stops observing it", () => {
    const { container } = render(
      <SectionWipeReveal>
        <p>Content</p>
      </SectionWipeReveal>,
    );
    const host = container.firstElementChild as HTMLElement;
    expect(host).not.toHaveClass(RUN_CLASS);

    act(() => {
      FakeIntersectionObserver.latest()!.trigger([
        { isIntersecting: true, target: host, intersectionRatio: 1 },
      ]);
    });

    expect(host).toHaveClass(RUN_CLASS);
    expect(FakeIntersectionObserver.latest()!.unobserve).toHaveBeenCalledWith(
      host,
    );
  });

  it("does not arm an observer, and never adds --run, for a section already visible at first paint", () => {
    mockOnscreenRect();
    const { container } = render(
      <SectionWipeReveal>
        <p data-testid="child">Content</p>
      </SectionWipeReveal>,
    );

    expect(FakeIntersectionObserver.latest()).toBeUndefined();
    expect(screen.getByTestId("child")).toBeVisible();
    expect(container.firstElementChild).not.toHaveClass(RUN_CLASS);
  });

  it("does not arm an observer, and never adds --run, for a section already scrolled past at mount", () => {
    // e.g. a back-navigation that restores scroll to the foot of the page —
    // the section is above the viewport, not below it, but it is content
    // the visitor already read and must not replay the wipe on.
    mockScrolledPastRect();
    const { container } = render(
      <SectionWipeReveal>
        <p data-testid="child">Content</p>
      </SectionWipeReveal>,
    );

    expect(FakeIntersectionObserver.latest()).toBeUndefined();
    expect(screen.getByTestId("child")).toBeVisible();
    expect(container.firstElementChild).not.toHaveClass(RUN_CLASS);
  });

  it("passes className straight through, unmerged", () => {
    // Regression guard: a single-argument cn(className) call buys the
    // #2769 tailwind-merge hazard for no benefit — match the
    // ArticleBodyMotion peer and assign the prop directly.
    const { container } = render(
      <SectionWipeReveal className="text-body-md bg-cream-soft">
        <p>Content</p>
      </SectionWipeReveal>,
    );
    expect(container.firstElementChild).toHaveClass(
      "text-body-md",
      "bg-cream-soft",
    );
  });

  it("does not instantiate an observer when prefers-reduced-motion is reduce", () => {
    stubMatchMedia(true);
    const { container } = render(
      <SectionWipeReveal>
        <p data-testid="child">Content</p>
      </SectionWipeReveal>,
    );

    expect(FakeIntersectionObserver.latest()).toBeUndefined();
    expect(screen.getByTestId("child")).toBeVisible();
    expect(container.firstElementChild).not.toHaveClass(RUN_CLASS);
  });

  it("degrades to fully visible when IntersectionObserver is unsupported", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(
      <SectionWipeReveal>
        <p data-testid="child">Content</p>
      </SectionWipeReveal>,
    );

    expect(screen.getByTestId("child")).toBeVisible();
    expect(container.firstElementChild).not.toHaveClass(RUN_CLASS);
  });

  it("degrades to fully visible when the observer is armed but its callback never fires", () => {
    // Deliberately breaking the trigger: the observer is constructed and
    // observe() is called, but nothing ever invokes its callback — the
    // real-world stand-in for "the observer never firing" (#2623 AC).
    const { container } = render(
      <SectionWipeReveal>
        <p data-testid="child">Content</p>
      </SectionWipeReveal>,
    );

    expect(FakeIntersectionObserver.latest()).not.toBeUndefined();
    expect(FakeIntersectionObserver.latest()!.observe).toHaveBeenCalledTimes(1);
    // No callback invocation happens here — by design.
    expect(screen.getByTestId("child")).toBeVisible();
    expect(container.firstElementChild).not.toHaveClass(RUN_CLASS);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(
      <SectionWipeReveal>
        <p>Content</p>
      </SectionWipeReveal>,
    );
    expect(FakeIntersectionObserver.latest()).not.toBeUndefined();
    unmount();
    expect(FakeIntersectionObserver.latest()!.disconnect).toHaveBeenCalledTimes(
      1,
    );
  });
});
