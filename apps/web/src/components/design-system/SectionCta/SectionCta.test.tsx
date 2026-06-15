import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionCta } from "./SectionCta";

const defaultProps = {
  heading: "Aansluiten bij KCVV Elewijt?",
  body: "Vanaf de allerkleinsten tot de eerste ploeg — iedereen is welkom.",
  buttonLabel: "Meer info",
  buttonHref: "/club/aansluiten",
};

describe("SectionCta", () => {
  describe("Rendering", () => {
    it("should render heading, body, and button", () => {
      render(<SectionCta {...defaultProps} />);

      expect(
        screen.getByRole("heading", { name: defaultProps.heading }),
      ).toBeInTheDocument();
      expect(screen.getByText(defaultProps.body)).toBeInTheDocument();

      const link = screen.getByRole("link", { name: /meer info/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", defaultProps.buttonHref);
    });
  });

  describe("Layout", () => {
    it("should use centered layout with max-w-[40rem]", () => {
      const { container } = render(<SectionCta {...defaultProps} />);
      const wrapper = container.firstElementChild;
      expect(wrapper).toHaveClass("max-w-[40rem]", "mx-auto", "text-center");
    });
  });

  describe("Typography", () => {
    it("should style heading with font-display font-extrabold text-ink-soft", () => {
      render(<SectionCta {...defaultProps} />);
      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass(
        "font-display",
        "font-extrabold",
        "text-ink-soft",
      );
    });

    it("should style body with text-sm text-ink-muted leading-relaxed", () => {
      render(<SectionCta {...defaultProps} />);
      const body = screen.getByText(defaultProps.body);
      expect(body).toHaveClass("text-sm", "text-ink-muted", "leading-relaxed");
    });
  });

  describe("Button", () => {
    it("should render LinkButton with withArrow", () => {
      render(<SectionCta {...defaultProps} />);
      const link = screen.getByRole("link", { name: /meer info/i });
      // LinkButton primary variant class
      expect(link).toHaveClass("bg-jersey-deep");
      // Arrow glyph should be present (typographic →, not an SVG)
      const arrow = link.querySelector('[aria-hidden="true"]');
      expect(arrow).toBeInTheDocument();
      expect(arrow?.tagName).toBe("SPAN");
      expect(arrow?.textContent).toBe("→");
      // Guard against the legacy Lucide/Phosphor SVG sneaking back in
      // alongside the new <span> if a future change reverts the migration.
      expect(link.querySelector("svg")).toBeNull();
    });
  });

  describe("Variants", () => {
    it("defaults to light variant — heading is text-ink-soft, body is text-ink-muted", () => {
      render(<SectionCta {...defaultProps} />);
      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("text-ink-soft");
      const body = screen.getByText(defaultProps.body);
      expect(body).toHaveClass("text-ink-muted");
    });

    it("dark variant uses white text for heading and white/75 for body", () => {
      render(<SectionCta {...defaultProps} variant="dark" />);
      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("text-white");
      const body = screen.getByText(defaultProps.body);
      expect(body).toHaveClass("text-white/75");
    });

    it("dark variant heading does NOT use the light text-ink-soft class", () => {
      render(<SectionCta {...defaultProps} variant="dark" />);
      const heading = screen.getByRole("heading");
      expect(heading).not.toHaveClass("text-ink-soft");
    });
  });
});
