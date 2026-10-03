/**
 * Spinner Component Tests
 *
 * Visual contract: scarf barber-pole (primary/secondary/white) + compact
 * three-dot pulse. Source-of-record: docs/design/mockups/phase-2-track-b/
 * option-d-paper-chrome-ink-emphasis.html (locked 2026-04-30).
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  describe("Rendering", () => {
    it('should have role="status"', () => {
      render(<Spinner />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should have default aria-label", () => {
      render(<Spinner />);
      expect(screen.getByRole("status")).toHaveAttribute(
        "aria-label",
        "Laden…",
      );
    });

    it("should have custom label", () => {
      render(<Spinner label="Loading articles..." />);
      expect(screen.getByRole("status")).toHaveAttribute(
        "aria-label",
        "Loading articles...",
      );
      expect(screen.getByText("Loading articles...")).toHaveClass("sr-only");
    });

    it("should render the compact dot pulse by default", () => {
      // Waiting-Device Rule (DESIGN.md → Motion): the scarf is search-only,
      // so the component defaults to the dots and the scarf must be
      // requested explicitly via variant="primary".
      const { container } = render(<Spinner />);
      expect(
        container.querySelector(".kcvv-spinner-pulse"),
      ).toBeInTheDocument();
    });
  });

  describe("Compact root element", () => {
    it("should render a span so it is valid inside a <p> and an <a> (#3386)", () => {
      // A `div` inside a paragraph or an anchor in a paragraph is a DOM-nesting
      // error; the dots ride inside prose links.
      render(<Spinner variant="compact" />);
      expect(screen.getByRole("status").tagName).toBe("SPAN");
    });
  });

  describe("Sizes (scarf variants)", () => {
    it("should render medium size by default", () => {
      const { container } = render(<Spinner variant="primary" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--md");
    });

    it("should render small size", () => {
      const { container } = render(<Spinner variant="primary" size="sm" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--sm");
    });

    it("should render large size", () => {
      const { container } = render(<Spinner variant="primary" size="lg" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--lg");
    });

    it("should render extra large size", () => {
      const { container } = render(<Spinner variant="primary" size="xl" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--xl");
    });
  });

  describe("Variants", () => {
    it("should render compact dots by default", () => {
      const { container } = render(<Spinner />);
      expect(
        container.querySelector(".kcvv-spinner-pulse"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".kcvv-spinner-scarf"),
      ).not.toBeInTheDocument();
    });

    it("should render primary scarf when requested", () => {
      const { container } = render(<Spinner variant="primary" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--primary");
    });

    it("should render secondary scarf", () => {
      const { container } = render(<Spinner variant="secondary" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--secondary");
    });

    it("should render white scarf", () => {
      const { container } = render(<Spinner variant="white" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--white");
    });

    it("should render compact three-dot pulse with three dots", () => {
      const { container } = render(<Spinner variant="compact" />);
      const pulse = container.querySelector(".kcvv-spinner-pulse");
      expect(pulse).toBeInTheDocument();
      expect(pulse?.querySelectorAll("span")).toHaveLength(3);
    });

    it("should not render scarf for compact variant", () => {
      const { container } = render(<Spinner variant="compact" />);
      expect(
        container.querySelector(".kcvv-spinner-scarf"),
      ).not.toBeInTheDocument();
    });

    it("should ignore size prop for compact variant", () => {
      const { container } = render(<Spinner variant="compact" size="xl" />);
      expect(
        container.querySelector(".kcvv-spinner-pulse"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".kcvv-spinner-scarf"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have screen reader text", () => {
      render(<Spinner label="Loading content" />);
      const srText = screen.getByText("Loading content");
      expect(srText).toHaveClass("sr-only");
    });

    it("should be announced to screen readers", () => {
      render(<Spinner />);
      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-label");
    });

    it("should expose sr-only label on compact variant", () => {
      render(<Spinner variant="compact" label="Bijwerken" />);
      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-label", "Bijwerken");
      expect(screen.getByText("Bijwerken")).toHaveClass("sr-only");
    });
  });

  describe("Custom Props", () => {
    it("should accept custom className on the wrapper", () => {
      const { container } = render(<Spinner className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(<Spinner ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe("Combination Props", () => {
    it("should combine size and variant on scarf", () => {
      const { container } = render(<Spinner size="lg" variant="secondary" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass(
        "kcvv-spinner-scarf--lg",
        "kcvv-spinner-scarf--secondary",
      );
    });

    it("should combine all props", () => {
      const { container } = render(
        <Spinner
          size="xl"
          variant="primary"
          label="Custom loading"
          className="custom"
        />,
      );
      const wrapper = container.firstChild as HTMLElement;
      const scarf = container.querySelector(".kcvv-spinner-scarf");

      expect(wrapper).toHaveClass("custom");
      expect(scarf).toHaveClass(
        "kcvv-spinner-scarf--xl",
        "kcvv-spinner-scarf--primary",
      );
      expect(wrapper).toHaveAttribute("aria-label", "Custom loading");
    });
  });
});
