/**
 * AlertBadge Component Tests
 *
 * Direction E ("Angled badge + italic Freight Display message") locked
 * at the Phase 2.A.5 design checkpoint (2026-04-30). PRD §6.4.A.
 */

import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlertBadge } from "./AlertBadge";

/**
 * Per WAI-ARIA, success/warning use `role="status"` (polite) and error
 * uses `role="alert"` (assertive). Tests that don't care about role —
 * they just want the badge root to assert visual classes — use this
 * helper to dodge the role split.
 */
const getBadgeRoot = (container: HTMLElement) =>
  container.querySelector('[role="alert"], [role="status"]') as HTMLElement;

describe("AlertBadge", () => {
  describe("Rendering", () => {
    it("should render children content", () => {
      render(
        <AlertBadge variant="error">Geen geldig telefoonnummer.</AlertBadge>,
      );
      expect(
        screen.getByText("Geen geldig telefoonnummer."),
      ).toBeInTheDocument();
    });

    it("should have role='status' with aria-live=polite for success", () => {
      render(<AlertBadge variant="success">x</AlertBadge>);
      const root = screen.getByRole("status");
      expect(root).toBeInTheDocument();
      expect(root).toHaveAttribute("aria-live", "polite");
    });

    it("should have role='status' with aria-live=polite for warning", () => {
      render(<AlertBadge variant="warning">x</AlertBadge>);
      const root = screen.getByRole("status");
      expect(root).toHaveAttribute("aria-live", "polite");
    });

    it("should have role='alert' with aria-live=assertive for error", () => {
      render(<AlertBadge variant="error">x</AlertBadge>);
      const root = screen.getByRole("alert");
      expect(root).toHaveAttribute("aria-live", "assertive");
    });

    it("should forward ref to root div", () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <AlertBadge ref={ref} variant="success">
          x
        </AlertBadge>,
      );
      expect(ref.current).toBe(getBadgeRoot(container));
    });
  });

  describe("Variants — Direction E retro vocabulary", () => {
    it("renders the success variant with jersey-deep badge + message", () => {
      const { container } = render(
        <AlertBadge variant="success">x</AlertBadge>,
      );
      const alert = getBadgeRoot(container);
      const [badge, message] = Array.from(alert.children) as HTMLElement[];
      expect(badge).toHaveClass("bg-jersey-deep");
      expect(badge).toHaveClass("text-cream");
      expect(message).toHaveClass("text-jersey-deep");
    });

    it("renders the warning variant with warning badge + message", () => {
      const { container } = render(
        <AlertBadge variant="warning">x</AlertBadge>,
      );
      const alert = getBadgeRoot(container);
      const [badge, message] = Array.from(alert.children) as HTMLElement[];
      expect(badge).toHaveClass("bg-warning");
      expect(badge).toHaveClass("text-cream");
      expect(message).toHaveClass("text-warning");
    });

    it("renders the error variant with alert badge + message", () => {
      const { container } = render(<AlertBadge variant="error">x</AlertBadge>);
      const alert = getBadgeRoot(container);
      const [badge, message] = Array.from(alert.children) as HTMLElement[];
      expect(badge).toHaveClass("bg-alert");
      expect(badge).toHaveClass("text-cream");
      expect(message).toHaveClass("text-alert");
    });
  });

  describe("Visual contract — chrome", () => {
    it("badge is rotated -2deg (paper-stamp idiom)", () => {
      const { container } = render(
        <AlertBadge variant="success">x</AlertBadge>,
      );
      const badge = getBadgeRoot(container).children[0] as HTMLElement;
      expect(badge.className).toContain("-rotate-2");
    });

    it("badge has ink border + 3 × 3 ink shadow", () => {
      const { container } = render(
        <AlertBadge variant="success">x</AlertBadge>,
      );
      const badge = getBadgeRoot(container).children[0] as HTMLElement;
      expect(badge).toHaveClass("border-2");
      expect(badge).toHaveClass("border-ink");
      expect(badge.className).toContain(
        "shadow-[3px_3px_0_0_var(--color-ink)]",
      );
    });

    it("badge uses mono caps with wide tracking", () => {
      const { container } = render(
        <AlertBadge variant="success">x</AlertBadge>,
      );
      const badge = getBadgeRoot(container).children[0] as HTMLElement;
      expect(badge).toHaveClass("font-mono");
      expect(badge).toHaveClass("uppercase");
      expect(badge.className).toContain("tracking-[0.12em]");
    });

    it("badge has sharp corners (rounded-none)", () => {
      const { container } = render(
        <AlertBadge variant="success">x</AlertBadge>,
      );
      const badge = getBadgeRoot(container).children[0] as HTMLElement;
      expect(badge).toHaveClass("rounded-none");
    });

    it("message uses italic Freight Display at 22px", () => {
      const { container } = render(
        <AlertBadge variant="success">x</AlertBadge>,
      );
      const message = getBadgeRoot(container).children[1] as HTMLElement;
      expect(message).toHaveClass("font-display");
      expect(message).toHaveClass("italic");
      expect(message.className).toContain("text-[22px]");
    });
  });

  describe("Multi-line layout", () => {
    it("uses items-start so the badge anchors to line 1 of the message", () => {
      const { container } = render(
        <AlertBadge variant="success">
          A long message that wraps to two or more lines.
        </AlertBadge>,
      );
      expect(getBadgeRoot(container)).toHaveClass("items-start");
    });

    it("badge has a small top margin to align with the cap-height of line 1", () => {
      const { container } = render(
        <AlertBadge variant="success">x</AlertBadge>,
      );
      const badge = getBadgeRoot(container).children[0] as HTMLElement;
      expect(badge.className).toContain("mt-[2px]");
    });
  });

  describe("Variant labels", () => {
    it("success badge shows MELDING label", () => {
      render(<AlertBadge variant="success">x</AlertBadge>);
      expect(screen.getByText("MELDING")).toBeInTheDocument();
    });

    it("warning badge shows WAARSCHUWING label", () => {
      render(<AlertBadge variant="warning">x</AlertBadge>);
      expect(screen.getByText("WAARSCHUWING")).toBeInTheDocument();
    });

    it("error badge shows FOUT label", () => {
      render(<AlertBadge variant="error">x</AlertBadge>);
      expect(screen.getByText("FOUT")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders the icon with aria-hidden", () => {
      const { container } = render(
        <AlertBadge variant="success">x</AlertBadge>,
      );
      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Custom props", () => {
    it("should accept custom className on the outer container", () => {
      const { container } = render(
        <AlertBadge variant="success" className="custom-badge">
          x
        </AlertBadge>,
      );
      expect(getBadgeRoot(container)).toHaveClass("custom-badge");
    });

    it("should forward id onto the outer container for aria-describedby", () => {
      const { container } = render(
        <AlertBadge variant="error" id="email-error">
          x
        </AlertBadge>,
      );
      expect(getBadgeRoot(container)).toHaveAttribute("id", "email-error");
    });
  });

  describe("Size — sm (form-row inline)", () => {
    it("uses subtler rotation (-rotate-1), 1.5px border, and 15px message", () => {
      const { container } = render(
        <AlertBadge variant="error" size="sm">
          x
        </AlertBadge>,
      );
      const root = getBadgeRoot(container);
      const [badge, message] = Array.from(root.children) as HTMLElement[];
      expect(root).toHaveAttribute("data-size", "sm");
      expect(badge.className).toContain("-rotate-1");
      expect(badge.className).not.toContain("-rotate-2");
      expect(badge.className).toContain("border-[1.5px]");
      expect(message.className).toContain("text-[15px]");
    });

    it("retains the same FOUT label and italic Freight Display message", () => {
      const { container } = render(
        <AlertBadge variant="error" size="sm">
          x
        </AlertBadge>,
      );
      expect(screen.getByText("FOUT")).toBeInTheDocument();
      const message = getBadgeRoot(container).children[1] as HTMLElement;
      expect(message).toHaveClass("font-display");
      expect(message).toHaveClass("italic");
    });
  });
});
