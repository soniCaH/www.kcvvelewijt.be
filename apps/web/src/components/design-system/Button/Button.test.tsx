/**
 * Button Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  describe("Rendering", () => {
    it("should render with children", () => {
      render(<Button>Click me</Button>);
      expect(
        screen.getByRole("button", { name: /click me/i }),
      ).toBeInTheDocument();
    });

    it("should render as a button element", () => {
      render(<Button>Submit</Button>);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });
  });

  describe("Variants", () => {
    it("should render primary variant by default", () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-jersey", "text-cream");
    });

    it("should render secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-kcvv-gray");
    });

    it("should render ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border-2", "border-kcvv-green-bright");
    });

    it("should render link variant", () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "text-kcvv-green-bright",
        "underline-offset-4",
      );
    });
  });

  describe("Sizes", () => {
    it("should render medium size by default", () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-base", "px-8", "py-3");
    });

    it("should render small size", () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-sm", "px-6", "py-2");
    });

    it("should render large size", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-lg", "px-10", "py-4");
    });
  });

  describe("Arrow Icon", () => {
    it("should not show arrow by default", () => {
      render(<Button>No Arrow</Button>);
      const button = screen.getByRole("button");
      expect(button.querySelector("svg")).not.toBeInTheDocument();
    });

    it("should show arrow when withArrow is true", () => {
      render(<Button withArrow>With Arrow</Button>);
      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Full Width", () => {
    it("should not be full width by default", () => {
      render(<Button>Normal Width</Button>);
      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("w-full");
    });

    it("should be full width when fullWidth is true", () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-full");
    });
  });

  describe("Disabled State", () => {
    it("has correct disabled styles", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button", { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass("opacity-50");
      expect(button).toHaveClass("cursor-not-allowed");
    });

    it("should not call onClick when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Interactions", () => {
    it("should call onClick when clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should handle keyboard interaction (Enter)", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Press Enter</Button>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should handle keyboard interaction (Space)", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Press Space</Button>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Custom Props", () => {
    it("should accept custom className", () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("should accept type attribute", () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should accept aria-label", () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByRole("button", { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(<Button ref={ref}>Ref Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("Accessibility", () => {
    it("should have focus-visible styles", () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "focus-visible:outline-none",
        "focus-visible:ring-2",
      );
    });

    it("should be keyboard accessible", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
        </div>,
      );

      // Tab to first button
      await user.tab();
      expect(screen.getByRole("button", { name: /first/i })).toHaveFocus();

      // Tab to second button
      await user.tab();
      expect(screen.getByRole("button", { name: /second/i })).toHaveFocus();
    });
  });

  describe("Combination Props", () => {
    it("should combine variant, size, and arrow", () => {
      render(
        <Button variant="secondary" size="lg" withArrow>
          Combined
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-kcvv-gray"); // secondary
      expect(button).toHaveClass("text-lg"); // large
      expect(button.querySelector("svg")).toBeInTheDocument(); // arrow
    });

    it("should combine all props", () => {
      render(
        <Button
          variant="ghost"
          size="sm"
          withArrow
          fullWidth
          className="custom"
          disabled
        >
          All Props
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border-kcvv-green-bright"); // ghost
      expect(button).toHaveClass("text-sm"); // small
      expect(button).toHaveClass("w-full"); // fullWidth
      expect(button).toHaveClass("custom"); // custom className
      expect(button).toBeDisabled(); // disabled
      expect(button.querySelector("svg")).toBeInTheDocument(); // arrow
    });
  });
});
