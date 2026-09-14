/**
 * HorizontalSlider Component Tests
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Arrows are `<ScrollArrowButton
 * register="paper">` — the card slider's own register (#2444, as amended
 * by #2489). `title`/`theme` were deleted (#2444 resolution) — neither had
 * a consumer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HorizontalSlider } from "./HorizontalSlider";
import { stubAnimationFrame } from "@/../tests/helpers/scroll-hint.helpers";

function mockScrollDimensions(scrollWidth = 1000, clientWidth = 500) {
  const originalScrollWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollWidth",
  );
  const originalClientWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientWidth",
  );

  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    value: scrollWidth,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    value: clientWidth,
  });

  return () => {
    if (originalScrollWidth) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollWidth",
        originalScrollWidth,
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (HTMLElement.prototype as any).scrollWidth;
    }

    if (originalClientWidth) {
      Object.defineProperty(
        HTMLElement.prototype,
        "clientWidth",
        originalClientWidth,
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (HTMLElement.prototype as any).clientWidth;
    }

    vi.restoreAllMocks();
  };
}

describe("HorizontalSlider", () => {
  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <HorizontalSlider>
          <div data-testid="child-1">Item 1</div>
          <div data-testid="child-2">Item 2</div>
        </HorizontalSlider>,
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });

    it("should accept custom className", () => {
      const { container } = render(
        <HorizontalSlider className="custom-class">
          <div>Item</div>
        </HorizontalSlider>,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should have hidden scrollbar styles", () => {
      const { container } = render(
        <HorizontalSlider>
          <div>Item</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;
      expect(scrollContainer.style.scrollbarWidth).toBe("none");
    });

    it("makes the scroll track keyboard-reachable (tabIndex=0)", () => {
      const { container } = render(
        <HorizontalSlider>
          <div>Item</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;
      expect(scrollContainer.getAttribute("tabindex")).toBe("0");
    });

    it("names the scroll track with a default accessible name", () => {
      const { container } = render(
        <HorizontalSlider>
          <div>Item</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;
      expect(scrollContainer.getAttribute("role")).toBe("group");
      expect(scrollContainer.getAttribute("aria-label")).toBe(
        "Scrollable cards",
      );
    });

    it("accepts a caller-supplied accessible name", () => {
      const { container } = render(
        <HorizontalSlider ariaLabel="Gerelateerde artikelen">
          <div>Item</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;
      expect(scrollContainer.getAttribute("aria-label")).toBe(
        "Gerelateerde artikelen",
      );
    });

    it("defaults the track gap to gap-6 md:gap-8", () => {
      const { container } = render(
        <HorizontalSlider>
          <div>Item</div>
        </HorizontalSlider>,
      );

      const track = container.querySelector(
        "[data-slot='scroll-track'] > div",
      ) as HTMLElement;
      expect(track).toHaveClass("gap-6");
      expect(track).toHaveClass("md:gap-8");
    });

    it("merges trackClassName onto the inner track", () => {
      const { container } = render(
        <HorizontalSlider trackClassName="gap-3">
          <div>Item</div>
        </HorizontalSlider>,
      );

      const track = container.querySelector(
        "[data-slot='scroll-track'] > div",
      ) as HTMLElement;
      expect(track).toHaveClass("gap-3");
    });
  });

  describe("Scroll Arrows — paper register", () => {
    let restoreScrollDimensions: () => void;

    beforeEach(() => {
      restoreScrollDimensions = mockScrollDimensions();
    });

    afterEach(() => {
      restoreScrollDimensions();
    });

    it("should show right arrow when content overflows", () => {
      render(
        <HorizontalSlider>
          <div>Item 1</div>
          <div>Item 2</div>
        </HorizontalSlider>,
      );

      expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
    });

    it("renders the right arrow at 48 × 48 (paper register)", () => {
      render(
        <HorizontalSlider>
          <div>Item 1</div>
        </HorizontalSlider>,
      );

      const arrow = screen.getByLabelText("Scroll right");
      expect(arrow).toHaveClass("h-12");
      expect(arrow).toHaveClass("w-12");
      expect(arrow).toHaveClass("bg-cream");
    });

    it("overhangs the right arrow at -16px", () => {
      render(
        <HorizontalSlider>
          <div>Item 1</div>
        </HorizontalSlider>,
      );

      expect(screen.getByLabelText("Scroll right").className).toContain(
        "right-[-16px]",
      );
    });

    it("should not show left arrow at initial position", () => {
      render(
        <HorizontalSlider>
          <div>Item 1</div>
          <div>Item 2</div>
        </HorizontalSlider>,
      );

      expect(screen.queryByLabelText("Scroll left")).not.toBeInTheDocument();
    });

    it("should show left arrow after scrolling right", () => {
      const { container } = render(
        <HorizontalSlider>
          <div>Item 1</div>
          <div>Item 2</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;

      Object.defineProperty(scrollContainer, "scrollLeft", { value: 100 });

      const { flush } = stubAnimationFrame();
      act(() => {
        scrollContainer.dispatchEvent(new Event("scroll"));
      });
      act(() => {
        flush();
      });

      expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
    });

    it("overhangs the left arrow at -16px", () => {
      const { container } = render(
        <HorizontalSlider>
          <div>Item 1</div>
          <div>Item 2</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;
      Object.defineProperty(scrollContainer, "scrollLeft", { value: 100 });
      const { flush } = stubAnimationFrame();
      act(() => {
        scrollContainer.dispatchEvent(new Event("scroll"));
      });
      act(() => {
        flush();
      });

      expect(screen.getByLabelText("Scroll left").className).toContain(
        "left-[-16px]",
      );
    });

    it("should hide right arrow when scrolled to end", () => {
      const { container } = render(
        <HorizontalSlider>
          <div>Item 1</div>
          <div>Item 2</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;

      Object.defineProperty(scrollContainer, "scrollLeft", { value: 500 });
      Object.defineProperty(scrollContainer, "scrollWidth", { value: 1000 });
      Object.defineProperty(scrollContainer, "clientWidth", { value: 500 });

      const { flush } = stubAnimationFrame();
      act(() => {
        scrollContainer.dispatchEvent(new Event("scroll"));
      });
      act(() => {
        flush();
      });

      expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
    });

    it("should scroll left when left arrow is clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <HorizontalSlider>
          <div>Item 1</div>
          <div>Item 2</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;
      const scrollToSpy = vi.fn();
      scrollContainer.scrollTo = scrollToSpy;

      Object.defineProperty(scrollContainer, "scrollLeft", { value: 200 });
      const { flush } = stubAnimationFrame();
      act(() => {
        scrollContainer.dispatchEvent(new Event("scroll"));
      });
      act(() => {
        flush();
      });

      await user.click(screen.getByLabelText("Scroll left"));
      expect(scrollToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          left: expect.any(Number),
          behavior: "smooth",
        }),
      );
      expect(scrollToSpy.mock.calls[0][0].left).toBeLessThan(200);
    });

    it("should scroll right when right arrow is clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <HorizontalSlider>
          <div>Item 1</div>
          <div>Item 2</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;
      const scrollToSpy = vi.fn();
      scrollContainer.scrollTo = scrollToSpy;

      await user.click(screen.getByLabelText("Scroll right"));
      expect(scrollToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          left: expect.any(Number),
          behavior: "smooth",
        }),
      );
      expect(scrollToSpy.mock.calls[0][0].left).toBeGreaterThan(0);
    });

    it("scrolls by 0.8 × the track's clientWidth (proportional step)", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <HorizontalSlider>
          <div>Item 1</div>
        </HorizontalSlider>,
      );

      const scrollContainer = container.querySelector(
        "[data-slot='scroll-track']",
      ) as HTMLElement;
      const scrollToSpy = vi.fn();
      scrollContainer.scrollTo = scrollToSpy;

      await user.click(screen.getByLabelText("Scroll right"));
      expect(scrollToSpy).toHaveBeenCalledWith({
        left: 500 * 0.8,
        behavior: "smooth",
      });
    });
  });

  describe("Cleanup", () => {
    it("should clean up event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = render(
        <HorizontalSlider>
          <div>Item</div>
        </HorizontalSlider>,
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
