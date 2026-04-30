/**
 * HorizontalSlider Component Tests
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Arrows are now `<ScrollArrowButton>`
 * paper buttons; tests assert the new contract — incl. the `theme="dark"`
 * shadow override.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HorizontalSlider } from "./HorizontalSlider";

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

    it("should render title when provided", () => {
      render(
        <HorizontalSlider title="Section Title">
          <div>Item</div>
        </HorizontalSlider>,
      );

      expect(
        screen.getByRole("heading", { name: "Section Title" }),
      ).toBeInTheDocument();
    });

    it("should not render title when not provided", () => {
      render(
        <HorizontalSlider>
          <div>Item</div>
        </HorizontalSlider>,
      );

      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
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

    it('annotates the wrapper with data-slider-theme="dark" for the dark theme', () => {
      const { container } = render(
        <HorizontalSlider theme="dark">
          <div>Item</div>
        </HorizontalSlider>,
      );

      expect(container.firstChild).toHaveAttribute("data-slider-theme", "dark");
    });

    it('annotates the wrapper with data-slider-theme="light" by default', () => {
      const { container } = render(
        <HorizontalSlider>
          <div>Item</div>
        </HorizontalSlider>,
      );

      expect(container.firstChild).toHaveAttribute(
        "data-slider-theme",
        "light",
      );
    });
  });

  describe("Scroll Arrows", () => {
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

      act(() => {
        scrollContainer.dispatchEvent(new Event("scroll"));
      });

      expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
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

      act(() => {
        scrollContainer.dispatchEvent(new Event("scroll"));
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
      const scrollBySpy = vi.fn();
      scrollContainer.scrollBy = scrollBySpy;

      Object.defineProperty(scrollContainer, "scrollLeft", { value: 200 });
      act(() => {
        scrollContainer.dispatchEvent(new Event("scroll"));
      });

      await user.click(screen.getByLabelText("Scroll left"));
      expect(scrollBySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          left: expect.any(Number),
          behavior: "smooth",
        }),
      );
      expect(scrollBySpy.mock.calls[0][0].left).toBeLessThan(0);
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
      const scrollBySpy = vi.fn();
      scrollContainer.scrollBy = scrollBySpy;

      await user.click(screen.getByLabelText("Scroll right"));
      expect(scrollBySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          left: expect.any(Number),
          behavior: "smooth",
        }),
      );
      expect(scrollBySpy.mock.calls[0][0].left).toBeGreaterThan(0);
    });
  });

  describe("Theme — paper-card arrows on both light and dark surfaces", () => {
    let restoreScrollDimensions: () => void;

    beforeEach(() => {
      restoreScrollDimensions = mockScrollDimensions();
    });

    afterEach(() => {
      restoreScrollDimensions();
    });

    it("light theme uses the standard ink offset shadow on arrows", () => {
      render(
        <HorizontalSlider>
          <div>Item 1</div>
        </HorizontalSlider>,
      );

      const rightArrow = screen.getByLabelText("Scroll right");
      expect(rightArrow.className).toContain("shadow-[var(--shadow-paper-sm)]");
      expect(rightArrow.className).not.toContain("--shadow-paper-sm-soft");
    });

    it("dark theme overrides the arrow shadow to the soft (ink-muted) sibling", () => {
      render(
        <HorizontalSlider theme="dark">
          <div>Item 1</div>
        </HorizontalSlider>,
      );

      const rightArrow = screen.getByLabelText("Scroll right");
      expect(rightArrow.className).toContain(
        "shadow-[var(--shadow-paper-sm-soft)]",
      );
      expect(rightArrow.className).toContain(
        "hover:shadow-[3px_3px_0_0_var(--color-ink-muted)]",
      );
    });

    it("uses retro typography colours for the title (cream on dark, ink on light)", () => {
      const { rerender } = render(
        <HorizontalSlider title="Light Title">
          <div>Item 1</div>
        </HorizontalSlider>,
      );

      expect(screen.getByRole("heading", { name: "Light Title" })).toHaveClass(
        "text-ink",
      );

      rerender(
        <HorizontalSlider theme="dark" title="Dark Title">
          <div>Item 1</div>
        </HorizontalSlider>,
      );

      expect(screen.getByRole("heading", { name: "Dark Title" })).toHaveClass(
        "text-cream",
      );
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
