/**
 * ScrollArrowButton tests
 *
 * Visual contract: 48 × 48 paper button with `border-2 ink` +
 * `--shadow-paper-sm` + `bg-cream` + italic Freight Display `←` / `→`
 * glyph. Single canonical button — no `variant` prop. Locked at the
 * Track B design checkpoint (2026-04-30, Direction D). Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html
 * (`.arrow-btn` rules).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScrollArrowButton } from "./ScrollArrowButton";

describe("ScrollArrowButton", () => {
  describe("Rendering", () => {
    it("renders a button with the correct aria-label for left direction", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
    });

    it("renders a button with the correct aria-label for right direction", () => {
      render(<ScrollArrowButton direction="right" onClick={vi.fn()} />);
      expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
    });

    it("calls onClick when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<ScrollArrowButton direction="right" onClick={onClick} />);

      await user.click(screen.getByLabelText("Scroll right"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Visual contract — Direction D paper button", () => {
    it("renders the canonical 48 × 48 paper-card body", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("h-12");
      expect(button).toHaveClass("w-12");
      expect(button).toHaveClass("bg-cream");
      expect(button).toHaveClass("border-2");
      expect(button).toHaveClass("border-ink");
      expect(button).toHaveClass("shadow-paper-sm");
    });

    it("uses sharp corners (rounded-none)", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("rounded-none");
    });

    it("renders italic Freight Display glyph (typographic, not an icon)", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll left");
      expect(button.className).toContain("font-display");
      expect(button).toHaveClass("italic");
      // No <svg> from a Lucide/Phosphor icon — glyph is plain text.
      expect(button.querySelector("svg")).toBeNull();
    });

    it("renders ← for left direction", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll left");
      expect(button.textContent?.trim()).toBe("←");
    });

    it("renders → for right direction", () => {
      render(<ScrollArrowButton direction="right" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll right");
      expect(button.textContent?.trim()).toBe("→");
    });
  });

  describe("Press idiom (canonical press-down hover)", () => {
    it("applies hover translate(1, 1) press utility classes", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("hover:translate-x-1");
      expect(button).toHaveClass("hover:translate-y-1");
    });

    it("hover collapses the shadow fully to none (canonical press-down)", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("hover:shadow-none");
    });

    it("uses the canonical 300ms duration for hover transitions", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("transition-all", "duration-300");
    });

    it("preserves focus-visible ring for keyboard navigation", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll left");
      expect(button.className).toContain("focus-visible:ring-2");
      expect(button.className).toContain("focus-visible:ring-jersey-deep");
    });
  });

  describe("Position", () => {
    it("absolute-positions the left arrow on the left edge", () => {
      render(<ScrollArrowButton direction="left" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("absolute");
      expect(button).toHaveClass("left-0");
      expect(button).toHaveClass("z-10");
    });

    it("absolute-positions the right arrow on the right edge", () => {
      render(<ScrollArrowButton direction="right" onClick={vi.fn()} />);
      const button = screen.getByLabelText("Scroll right");
      expect(button).toHaveClass("absolute");
      expect(button).toHaveClass("right-0");
      expect(button).toHaveClass("z-10");
    });
  });

  describe("Custom className", () => {
    it("merges a caller className onto the button", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          className="custom-class"
        />,
      );
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("custom-class");
    });
  });
});
