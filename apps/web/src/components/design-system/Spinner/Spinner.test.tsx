/**
 * Spinner Component Tests
 *
 * Visual contract: scarf barber-pole (primary/secondary/white) + compact
 * three-dot pulse. Source-of-record: docs/design/mockups/phase-2-track-b/
 * option-d-paper-chrome-ink-emphasis.html (locked 2026-04-30).
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner, FullPageSpinner } from "./Spinner";

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
        "Loading...",
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

    it("should render the scarf barber-pole element by default", () => {
      const { container } = render(<Spinner />);
      expect(
        container.querySelector(".kcvv-spinner-scarf"),
      ).toBeInTheDocument();
    });
  });

  describe("Sizes (scarf variants)", () => {
    it("should render medium size by default", () => {
      const { container } = render(<Spinner />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--md");
    });

    it("should render small size", () => {
      const { container } = render(<Spinner size="sm" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--sm");
    });

    it("should render large size", () => {
      const { container } = render(<Spinner size="lg" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--lg");
    });

    it("should render extra large size", () => {
      const { container } = render(<Spinner size="xl" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--xl");
    });
  });

  describe("Variants", () => {
    it("should render primary scarf by default", () => {
      const { container } = render(<Spinner />);
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
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
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

describe("FullPageSpinner", () => {
  describe("Rendering", () => {
    it("should render full page spinner overlay", () => {
      const { container } = render(<FullPageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass("fixed", "inset-0", "z-50");
    });

    it("should contain a spinner", () => {
      render(<FullPageSpinner />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should use xl size by default", () => {
      const { container } = render(<FullPageSpinner />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--xl");
    });

    it("should accept custom size", () => {
      const { container } = render(<FullPageSpinner size="md" />);
      const scarf = container.querySelector(".kcvv-spinner-scarf");
      expect(scarf).toHaveClass("kcvv-spinner-scarf--md");
    });

    it("should accept custom label", () => {
      render(<FullPageSpinner label="Loading application..." />);
      expect(screen.getByRole("status")).toHaveAttribute(
        "aria-label",
        "Loading application...",
      );
    });
  });

  describe("Styling", () => {
    it("should be centered", () => {
      const { container } = render(<FullPageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass("flex", "items-center", "justify-center");
    });

    it("should have high z-index", () => {
      const { container } = render(<FullPageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass("z-50");
    });
  });
});
