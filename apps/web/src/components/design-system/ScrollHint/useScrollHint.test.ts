import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { createElement, useEffect } from "react";
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
