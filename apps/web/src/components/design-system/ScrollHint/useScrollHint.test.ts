import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { createElement, useEffect } from "react";
import { FakeResizeObserver } from "@/../tests/helpers/fake-observers.helpers";
import { useScrollHint, type UseScrollHintReturn } from "./useScrollHint";

/**
 * Test helper: renders a div with the hook's scrollRef attached,
 * and captures the hook return value via a callback.
 */
function TestHost({ onHook }: { onHook: (h: UseScrollHintReturn) => void }) {
  const hook = useScrollHint();
  useEffect(() => {
    onHook(hook);
  });
  return createElement("div", {
    ref: hook.scrollRef,
    "data-testid": "scroll-container",
    style: { overflow: "auto" },
  });
}

describe("useScrollHint", () => {
  let savedScrollTo: PropertyDescriptor | undefined;
  let savedScrollWidth: PropertyDescriptor | undefined;
  let savedClientWidth: PropertyDescriptor | undefined;
  let savedScrollLeft: PropertyDescriptor | undefined;

  beforeEach(() => {
    savedScrollTo = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollTo",
    );
    savedScrollWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollWidth",
    );
    savedClientWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientWidth",
    );
    savedScrollLeft = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollLeft",
    );
  });

  afterEach(() => {
    const restore = (prop: string, desc: PropertyDescriptor | undefined) => {
      if (desc) {
        Object.defineProperty(HTMLElement.prototype, prop, desc);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (HTMLElement.prototype as any)[prop];
      }
    };
    restore("scrollTo", savedScrollTo);
    restore("scrollWidth", savedScrollWidth);
    restore("clientWidth", savedClientWidth);
    restore("scrollLeft", savedScrollLeft);
    vi.restoreAllMocks();
  });

  function renderScrollHint(scrollProps: {
    scrollWidth: number;
    clientWidth: number;
    scrollLeft: number;
  }) {
    let hookResult: UseScrollHintReturn | undefined;

    // Mock scrollWidth/clientWidth/scrollLeft on HTMLElement.prototype
    // so the element gets these values once the hook reads them
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return scrollProps.scrollWidth;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return scrollProps.clientWidth;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
      configurable: true,
      get() {
        return scrollProps.scrollLeft;
      },
    });

    const utils = render(
      createElement(TestHost, {
        onHook: (h: UseScrollHintReturn) => {
          hookResult = h;
        },
      }),
    );

    return { hookResult: hookResult!, ...utils };
  }

  it("returns canScrollLeft=false and canScrollRight=false when no overflow", () => {
    const { hookResult } = renderScrollHint({
      scrollWidth: 500,
      clientWidth: 500,
      scrollLeft: 0,
    });

    expect(hookResult.canScrollLeft).toBe(false);
    expect(hookResult.canScrollRight).toBe(false);
  });

  it("returns canScrollRight=true when content overflows to the right", () => {
    const { hookResult } = renderScrollHint({
      scrollWidth: 1000,
      clientWidth: 500,
      scrollLeft: 0,
    });

    expect(hookResult.canScrollRight).toBe(true);
    expect(hookResult.canScrollLeft).toBe(false);
  });

  it("returns canScrollLeft=true when scrolled past dead-zone", () => {
    const { hookResult } = renderScrollHint({
      scrollWidth: 1000,
      clientWidth: 500,
      scrollLeft: 100,
    });

    expect(hookResult.canScrollLeft).toBe(true);
    expect(hookResult.canScrollRight).toBe(true);
  });

  it("uses 10px dead-zone — scrollLeft=5 means canScrollLeft=false", () => {
    const { hookResult } = renderScrollHint({
      scrollWidth: 1000,
      clientWidth: 500,
      scrollLeft: 5,
    });

    expect(hookResult.canScrollLeft).toBe(false);
  });

  it("uses 10px dead-zone — 10px overflow means canScrollRight=false", () => {
    const { hookResult } = renderScrollHint({
      scrollWidth: 510,
      clientWidth: 500,
      scrollLeft: 0,
    });

    expect(hookResult.canScrollRight).toBe(false);
  });

  it("scrollLeft() calls scrollTo with decreased offset", () => {
    const scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });

    const { hookResult } = renderScrollHint({
      scrollWidth: 1000,
      clientWidth: 500,
      scrollLeft: 300,
    });

    act(() => {
      hookResult.scrollLeft();
    });

    expect(scrollToMock).toHaveBeenCalledWith({
      left: 100,
      behavior: "smooth",
    });
  });

  it("scrollLeft() honours a custom fixed scrollAmount", () => {
    const scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });

    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
      configurable: true,
      value: 300,
    });

    // TestHost doesn't accept options — exercised via a dedicated host.
    function CustomAmountHost({
      onHook,
    }: {
      onHook: (h: UseScrollHintReturn) => void;
    }) {
      const hook = useScrollHint({ scrollAmount: 999 });
      useEffect(() => {
        onHook(hook);
      });
      return createElement("div", { ref: hook.scrollRef });
    }

    let customResult: UseScrollHintReturn | undefined;
    render(
      createElement(CustomAmountHost, {
        onHook: (h: UseScrollHintReturn) => {
          customResult = h;
        },
      }),
    );

    act(() => {
      customResult!.scrollLeft();
    });

    expect(scrollToMock).toHaveBeenCalledWith({
      left: 300 - 999,
      behavior: "smooth",
    });
  });

  it("scrollAmount accepts a function of the track element (proportional step)", () => {
    const scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
      configurable: true,
      value: 0,
    });

    function ProportionalHost({
      onHook,
    }: {
      onHook: (h: UseScrollHintReturn) => void;
    }) {
      const hook = useScrollHint<HTMLDivElement>({
        scrollAmount: (el) => el.clientWidth * 0.8,
      });
      useEffect(() => {
        onHook(hook);
      });
      return createElement("div", { ref: hook.scrollRef });
    }

    let result: UseScrollHintReturn | undefined;
    render(
      createElement(ProportionalHost, {
        onHook: (h: UseScrollHintReturn) => {
          result = h;
        },
      }),
    );

    act(() => {
      result!.scrollRight();
    });

    expect(scrollToMock).toHaveBeenCalledWith({
      left: 0 + 400 * 0.8,
      behavior: "smooth",
    });
  });

  it("scrollRight() calls scrollTo with increased offset", () => {
    const scrollToMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });

    const { hookResult } = renderScrollHint({
      scrollWidth: 1000,
      clientWidth: 500,
      scrollLeft: 0,
    });

    act(() => {
      hookResult.scrollRight();
    });

    expect(scrollToMock).toHaveBeenCalledWith({
      left: 200,
      behavior: "smooth",
    });
  });

  describe("overflows", () => {
    it("is false when the track fits exactly", () => {
      const { hookResult } = renderScrollHint({
        scrollWidth: 500,
        clientWidth: 500,
        scrollLeft: 0,
      });

      expect(hookResult.overflows).toBe(false);
    });

    it("is true when the track overflows, regardless of scroll position", () => {
      const { hookResult } = renderScrollHint({
        scrollWidth: 1000,
        clientWidth: 500,
        scrollLeft: 0,
      });

      expect(hookResult.overflows).toBe(true);
    });

    it("stays true once scrolled all the way to the end — unlike canScrollRight", () => {
      const { hookResult } = renderScrollHint({
        scrollWidth: 1000,
        clientWidth: 500,
        scrollLeft: 500,
      });

      expect(hookResult.canScrollRight).toBe(false);
      expect(hookResult.overflows).toBe(true);
    });

    it("uses the 10px dead-zone — 8px overflow means overflows=false", () => {
      const { hookResult } = renderScrollHint({
        scrollWidth: 508,
        clientWidth: 500,
        scrollLeft: 0,
      });

      expect(hookResult.overflows).toBe(false);
    });
  });

  describe("remainingLeft / remainingRight", () => {
    it("reports the exact pixels left to scroll in each direction", () => {
      const { hookResult } = renderScrollHint({
        scrollWidth: 1000,
        clientWidth: 500,
        scrollLeft: 300,
      });

      expect(hookResult.remainingLeft).toBe(300);
      expect(hookResult.remainingRight).toBe(200);
    });

    it("is 0 on both sides when there is no overflow", () => {
      const { hookResult } = renderScrollHint({
        scrollWidth: 500,
        clientWidth: 500,
        scrollLeft: 0,
      });

      expect(hookResult.remainingLeft).toBe(0);
      expect(hookResult.remainingRight).toBe(0);
    });
  });

  describe("#2448 — re-measures when content changes without a container resize", () => {
    it("re-checks overflow when a child element's own box resizes", () => {
      // The track's own clientWidth/scrollWidth are read live off the
      // element by the getters below, so triggering the child's observed
      // ResizeObserver callback re-runs checkScroll and picks up the new
      // scrollWidth — exactly the scenario a web-font swap or a
      // Sanity-driven chip count produces without the track's own box
      // changing size.
      let currentScrollWidth = 500;
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get: () => currentScrollWidth,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        value: 0,
      });

      FakeResizeObserver.reset();
      vi.stubGlobal("ResizeObserver", FakeResizeObserver);

      let hookResult: UseScrollHintReturn | undefined;
      function HostWithChild({
        onHook,
      }: {
        onHook: (h: UseScrollHintReturn) => void;
      }) {
        const hook = useScrollHint();
        useEffect(() => {
          onHook(hook);
        });
        return createElement(
          "div",
          { ref: hook.scrollRef, "data-testid": "scroll-container" },
          createElement("div", { "data-testid": "child" }),
        );
      }

      render(
        createElement(HostWithChild, {
          onHook: (h: UseScrollHintReturn) => {
            hookResult = h;
          },
        }),
      );

      expect(hookResult!.overflows).toBe(false);
      // track + child
      expect(
        FakeResizeObserver.latest()!.observed.length,
      ).toBeGreaterThanOrEqual(2);

      // Content grows (e.g. the web font swaps in) without the track's own
      // box changing — a child ResizeObserver entry fires instead.
      currentScrollWidth = 900;
      act(() => {
        FakeResizeObserver.latest()!.trigger();
      });

      expect(hookResult!.overflows).toBe(true);

      vi.unstubAllGlobals();
    });
  });

  describe("children added after mount (a growing crumb trail)", () => {
    it("re-checks overflow when a child is appended later via a MutationObserver", async () => {
      // The organigram breadcrumb's own failure mode: it mounts with a
      // shallow trail (overflows === false), and every navigate() appends
      // a new crumb <span> the mount-time el.children snapshot never saw.
      // A one-shot ResizeObserver.observe() loop over el.children at mount
      // alone would leave that new span unwatched forever.
      let currentScrollWidth = 500;
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get: () => currentScrollWidth,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        value: 0,
      });

      let hookResult: UseScrollHintReturn | undefined;
      function GrowingHost({
        onHook,
        childCount,
      }: {
        onHook: (h: UseScrollHintReturn) => void;
        childCount: number;
      }) {
        const hook = useScrollHint();
        useEffect(() => {
          onHook(hook);
        });
        return createElement(
          "div",
          { ref: hook.scrollRef, "data-testid": "scroll-container" },
          ...Array.from({ length: childCount }, (_, i) =>
            createElement("span", { key: i, "data-testid": `crumb-${i}` }),
          ),
        );
      }

      const { rerender } = render(
        createElement(GrowingHost, {
          childCount: 1,
          onHook: (h: UseScrollHintReturn) => {
            hookResult = h;
          },
        }),
      );

      expect(hookResult!.overflows).toBe(false);

      // A crumb is appended (navigate() deeper into the tree) AND the
      // trail's real content width grows past the viewport — jsdom does
      // not run layout, so the growth is simulated via scrollWidth, but the
      // DOM mutation itself (the new <span>) is real and must be what
      // triggers the re-check, not a container resize (there is none).
      currentScrollWidth = 900;
      await act(async () => {
        rerender(
          createElement(GrowingHost, {
            childCount: 2,
            onHook: (h: UseScrollHintReturn) => {
              hookResult = h;
            },
          }),
        );
        // The MutationObserver callback is queued as a microtask, not run
        // synchronously by rerender() — flush it before asserting.
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(hookResult!.overflows).toBe(true);
    });
  });

  describe("overflows does not sustain itself off its own rail padding", () => {
    it("is false when scrollWidth's excess is entirely the track's own padding", () => {
      // Mirrors a rail track after rotation: content (600px) now fits at
      // the new 640px viewport, but the DOM still carries a prior render's
      // 80px of rail padding (40px each side) — scrollWidth therefore
      // still reads 680 (600 content + 80 padding), which is 40px more
      // than clientWidth even though the content itself fits with room to
      // spare. Without subtracting the currently-applied padding first,
      // this reads as overflowing forever once triggered.
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        value: 680,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 640,
      });
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        value: 0,
      });

      let hookResult: UseScrollHintReturn | undefined;
      function PaddedHost({
        onHook,
      }: {
        onHook: (h: UseScrollHintReturn) => void;
      }) {
        const hook = useScrollHint();
        useEffect(() => {
          onHook(hook);
        });
        return createElement("div", {
          ref: hook.scrollRef,
          "data-testid": "scroll-container",
          style: { paddingLeft: "40px", paddingRight: "40px" },
        });
      }

      render(
        createElement(PaddedHost, {
          onHook: (h: UseScrollHintReturn) => {
            hookResult = h;
          },
        }),
      );

      expect(hookResult!.overflows).toBe(false);
    });

    it("is true when the excess is real content, not padding", () => {
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        value: 900,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 640,
      });
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        value: 0,
      });

      let hookResult: UseScrollHintReturn | undefined;
      function PaddedHost({
        onHook,
      }: {
        onHook: (h: UseScrollHintReturn) => void;
      }) {
        const hook = useScrollHint();
        useEffect(() => {
          onHook(hook);
        });
        return createElement("div", {
          ref: hook.scrollRef,
          "data-testid": "scroll-container",
          style: { paddingLeft: "40px", paddingRight: "40px" },
        });
      }

      render(
        createElement(PaddedHost, {
          onHook: (h: UseScrollHintReturn) => {
            hookResult = h;
          },
        }),
      );

      // 900 scrollWidth - 80 padding - 640 clientWidth = 180, well past
      // the dead zone — genuinely overflowing, padding aside.
      expect(hookResult!.overflows).toBe(true);
    });
  });

  describe("remeasureOn — extra re-check triggers a ResizeObserver cannot see", () => {
    it("re-checks when a declared dependency changes, e.g. a zoom scale step", () => {
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        value: 0,
      });

      let currentScrollWidth = 500;
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get: () => currentScrollWidth,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 500,
      });

      let hookResult: UseScrollHintReturn | undefined;
      function ZoomHost({
        onHook,
        scaleStep,
      }: {
        onHook: (h: UseScrollHintReturn) => void;
        scaleStep: number;
      }) {
        const hook = useScrollHint({ remeasureOn: [scaleStep] });
        useEffect(() => {
          onHook(hook);
        });
        return createElement("div", {
          ref: hook.scrollRef,
          "data-testid": "scroll-container",
        });
      }

      const { rerender } = render(
        createElement(ZoomHost, {
          scaleStep: 0,
          onHook: (h: UseScrollHintReturn) => {
            hookResult = h;
          },
        }),
      );

      expect(hookResult!.overflows).toBe(false);

      // A CSS `transform: scale()` zoom never changes the track's own
      // border box, so no ResizeObserver entry fires for it — only the
      // declared `remeasureOn` dependency changing forces the re-check.
      currentScrollWidth = 900;
      act(() => {
        rerender(
          createElement(ZoomHost, {
            scaleStep: 1,
            onHook: (h: UseScrollHintReturn) => {
              hookResult = h;
            },
          }),
        );
      });

      expect(hookResult!.overflows).toBe(true);
    });
  });

  describe("transitionend — a bubbled CSS transition re-checks the final state", () => {
    it("re-checks scroll when a transitionend event bubbles up to the track", () => {
      let currentScrollWidth = 500;
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get: () => currentScrollWidth,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        value: 0,
      });

      let hookResult: UseScrollHintReturn | undefined;
      render(
        createElement(TestHost, {
          onHook: (h: UseScrollHintReturn) => {
            hookResult = h;
          },
        }),
      );

      expect(hookResult!.overflows).toBe(false);

      // A `transform: scale()` zoom animates over its transition duration —
      // by the time `transitionend` fires, the descendant has settled at
      // its final (larger) size, unlike the instant-but-possibly-mid-
      // animation read `remeasureOn` gets.
      currentScrollWidth = 900;
      const container = screen.getByTestId("scroll-container");
      act(() => {
        container.dispatchEvent(new Event("transitionend", { bubbles: true }));
      });

      expect(hookResult!.overflows).toBe(true);
    });
  });

  it("updates when scroll event fires on the container", () => {
    let scrollLeftValue = 0;

    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return 1000;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 500;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
      configurable: true,
      get() {
        return scrollLeftValue;
      },
    });

    let hookResult: UseScrollHintReturn | undefined;
    render(
      createElement(TestHost, {
        onHook: (h: UseScrollHintReturn) => {
          hookResult = h;
        },
      }),
    );

    expect(hookResult!.canScrollLeft).toBe(false);

    // Change the scrollLeft value and fire scroll event
    scrollLeftValue = 200;
    const container = screen.getByTestId("scroll-container");
    act(() => {
      container.dispatchEvent(new Event("scroll"));
    });

    expect(hookResult!.canScrollLeft).toBe(true);
    expect(hookResult!.canScrollRight).toBe(true);
  });
});
