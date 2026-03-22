/**
 * HorizontalSlider Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HorizontalSlider } from "./HorizontalSlider";

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
  });

  describe("Scroll Arrows", () => {
    let originalScrollWidth: PropertyDescriptor | undefined;
    let originalClientWidth: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalScrollWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "scrollWidth",
      );
      originalClientWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "clientWidth",
      );

      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        value: 1000,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 500,
      });
    });

    afterEach(() => {
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
    });

    it("should show right arrow when content overflows", () => {
      render(
        <HorizontalSlider>
          <div>Item 1</div>
          <div>Item 2</div>
        </HorizontalSlider>,
      );

      expect(screen.getByLabelText("Scroll naar rechts")).toBeInTheDocument();
    });

    it("should not show left arrow at initial position", () => {
      render(
        <HorizontalSlider>
          <div>Item 1</div>
          <div>Item 2</div>
        </HorizontalSlider>,
      );

      expect(
        screen.queryByLabelText("Scroll naar links"),
      ).not.toBeInTheDocument();
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

      expect(screen.getByLabelText("Scroll naar links")).toBeInTheDocument();
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

      expect(
        screen.queryByLabelText("Scroll naar rechts"),
      ).not.toBeInTheDocument();
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

      await user.click(screen.getByLabelText("Scroll naar links"));
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

      await user.click(screen.getByLabelText("Scroll naar rechts"));
      expect(scrollBySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          left: expect.any(Number),
          behavior: "smooth",
        }),
      );
      expect(scrollBySpy.mock.calls[0][0].left).toBeGreaterThan(0);
    });
  });

  describe("Theme", () => {
    let originalScrollWidth: PropertyDescriptor | undefined;
    let originalClientWidth: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalScrollWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "scrollWidth",
      );
      originalClientWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "clientWidth",
      );

      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        value: 1000,
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        value: 500,
      });
    });

    afterEach(() => {
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
    });

    it("should apply light theme styles to arrows by default", () => {
      render(
        <HorizontalSlider>
          <div>Item 1</div>
        </HorizontalSlider>,
      );

      const rightArrow = screen.getByLabelText("Scroll naar rechts");
      expect(rightArrow).toHaveClass("bg-white");
    });

    it("should apply dark theme styles to arrows", () => {
      render(
        <HorizontalSlider theme="dark">
          <div>Item 1</div>
        </HorizontalSlider>,
      );

      const rightArrow = screen.getByLabelText("Scroll naar rechts");
      expect(rightArrow).toHaveClass("bg-kcvv-black");
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
