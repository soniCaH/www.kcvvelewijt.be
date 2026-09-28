/**
 * ScrollArrowButton tests
 *
 * Visual contract: one arrow object in two registers (#2444, as amended by
 * #2489) — `"paper"` (48 × 48, cream, ink border, `--shadow-paper-sm`,
 * italic Freight glyph) and `"control"` (32 × 32, `jersey-deep` fill, cream
 * glyph, same border/shadow/glyph vocabulary). Both share sharp corners and
 * the canonical press-down hover. `disabled` renders the arrow inert in
 * place rather than unmounting it.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScrollArrowButton } from "./ScrollArrowButton";

describe("ScrollArrowButton", () => {
  describe("Rendering", () => {
    it("renders a button with the correct aria-label for left direction", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
    });

    it("renders a button with the correct aria-label for right direction", () => {
      render(
        <ScrollArrowButton
          direction="right"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
    });

    it("calls onClick when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <ScrollArrowButton
          direction="right"
          onClick={onClick}
          register="paper"
        />,
      );

      await user.click(screen.getByLabelText("Scroll right"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Visual contract — paper register (48 × 48)", () => {
    it("renders the canonical 48 × 48 cream paper-card body", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("h-12");
      expect(button).toHaveClass("w-12");
      expect(button).toHaveClass("bg-cream");
      expect(button).toHaveClass("border-2");
      expect(button).toHaveClass("border-ink");
      expect(button).toHaveClass("shadow-paper-sm");
    });

    it("uses sharp corners (rounded-none)", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      expect(screen.getByLabelText("Scroll left")).toHaveClass("rounded-none");
    });

    it("renders italic Freight Display glyph (typographic, not an icon)", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      const button = screen.getByLabelText("Scroll left");
      expect(button.className).toContain("font-display");
      expect(button).toHaveClass("italic");
      // No <svg> from a Lucide/Phosphor icon — glyph is plain text.
      expect(button.querySelector("svg")).toBeNull();
    });

    it("renders ← for left direction", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      expect(screen.getByLabelText("Scroll left").textContent?.trim()).toBe(
        "←",
      );
    });

    it("renders → for right direction", () => {
      render(
        <ScrollArrowButton
          direction="right"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      expect(screen.getByLabelText("Scroll right").textContent?.trim()).toBe(
        "→",
      );
    });
  });

  describe("Visual contract — control register (32 × 32, jersey-deep)", () => {
    it("renders a 32 × 32 jersey-deep body with a cream glyph", () => {
      render(
        <ScrollArrowButton
          direction="right"
          onClick={vi.fn()}
          register="control"
        />,
      );
      const button = screen.getByLabelText("Scroll right");
      expect(button).toHaveClass("h-8");
      expect(button).toHaveClass("w-8");
      expect(button).toHaveClass("bg-jersey-deep");
      expect(button).toHaveClass("text-cream");
    });

    it("keeps the ink border and paper shadow the paper register uses", () => {
      render(
        <ScrollArrowButton
          direction="right"
          onClick={vi.fn()}
          register="control"
        />,
      );
      const button = screen.getByLabelText("Scroll right");
      expect(button).toHaveClass("border-2");
      expect(button).toHaveClass("border-ink");
      expect(button).toHaveClass("shadow-paper-sm");
    });

    it("does not carry the paper register's cream fill", () => {
      render(
        <ScrollArrowButton
          direction="right"
          onClick={vi.fn()}
          register="control"
        />,
      );
      expect(screen.getByLabelText("Scroll right")).not.toHaveClass("bg-cream");
    });
  });

  describe("disabled — spent arrow stays in place", () => {
    it("renders a native disabled button rather than unmounting", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="control"
          disabled
        />,
      );
      const button = screen.getByLabelText("Scroll left");
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it("does not call onClick when disabled and clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <ScrollArrowButton
          direction="left"
          onClick={onClick}
          register="control"
          disabled
        />,
      );
      await user.click(screen.getByLabelText("Scroll left"));
      expect(onClick).not.toHaveBeenCalled();
    });

    it("dims the disabled arrow and blocks pointer events", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="control"
          disabled
        />,
      );
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("disabled:opacity-40");
      expect(button).toHaveClass("disabled:pointer-events-none");
    });

    it("defaults to enabled when disabled is omitted", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      expect(screen.getByLabelText("Scroll left")).not.toBeDisabled();
    });
  });

  describe("Press idiom (canonical press-down hover)", () => {
    it("applies hover translate(1, 1) press utility classes", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("hover:translate-x-1");
      expect(button).toHaveClass("hover:translate-y-1");
    });

    it("hover collapses the shadow fully to none (canonical press-down)", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      expect(screen.getByLabelText("Scroll left")).toHaveClass(
        "hover:shadow-none",
      );
    });

    it("uses the canonical 300ms duration for hover transitions", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      expect(screen.getByLabelText("Scroll left")).toHaveClass(
        "transition-all",
        "duration-300",
      );
    });

    it("preserves focus-visible ring for keyboard navigation", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      const button = screen.getByLabelText("Scroll left");
      expect(button.className).toContain("focus-visible:ring-2");
      expect(button.className).toContain("focus-visible:ring-jersey-deep");
    });
  });

  describe("Position", () => {
    it("absolute-positions the left arrow on the left edge", () => {
      render(
        <ScrollArrowButton
          direction="left"
          onClick={vi.fn()}
          register="paper"
        />,
      );
      const button = screen.getByLabelText("Scroll left");
      expect(button).toHaveClass("absolute");
      expect(button).toHaveClass("left-0");
      expect(button).toHaveClass("z-10");
    });

    it("absolute-positions the right arrow on the right edge", () => {
      render(
        <ScrollArrowButton
          direction="right"
          onClick={vi.fn()}
          register="paper"
        />,
      );
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
          register="paper"
          className="custom-class"
        />,
      );
      expect(screen.getByLabelText("Scroll left")).toHaveClass("custom-class");
    });
  });
});
