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
    it("should style heading with font-title font-extrabold text-kcvv-black", () => {
      render(<SectionCta {...defaultProps} />);
      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass(
        "font-title",
        "font-extrabold",
        "text-kcvv-black",
      );
    });

    it("should style body with text-sm text-kcvv-gray leading-relaxed", () => {
      render(<SectionCta {...defaultProps} />);
      const body = screen.getByText(defaultProps.body);
      expect(body).toHaveClass("text-sm", "text-kcvv-gray", "leading-relaxed");
    });
  });

  describe("Button", () => {
    it("should render LinkButton with withArrow", () => {
      render(<SectionCta {...defaultProps} />);
      const link = screen.getByRole("link", { name: /meer info/i });
      // LinkButton primary variant class
      expect(link).toHaveClass("bg-kcvv-green-bright");
      // Arrow icon should be present
      const icon = link.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Variants", () => {
    it("defaults to light variant — heading is text-kcvv-black, body is text-kcvv-gray", () => {
      render(<SectionCta {...defaultProps} />);
      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("text-kcvv-black");
      const body = screen.getByText(defaultProps.body);
      expect(body).toHaveClass("text-kcvv-gray");
    });

    it("dark variant uses white text for heading and white/75 for body", () => {
      render(<SectionCta {...defaultProps} variant="dark" />);
      const heading = screen.getByRole("heading");
      expect(heading).toHaveClass("text-white");
      const body = screen.getByText(defaultProps.body);
      expect(body).toHaveClass("text-white/75");
    });

    it("dark variant heading does NOT use the light text-kcvv-black class", () => {
      render(<SectionCta {...defaultProps} variant="dark" />);
      const heading = screen.getByRole("heading");
      expect(heading).not.toHaveClass("text-kcvv-black");
    });
  });
});
