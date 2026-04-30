import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LinkButton } from "./LinkButton";

describe("LinkButton", () => {
  describe("Rendering", () => {
    it("should render as an anchor element via next/link", () => {
      render(<LinkButton href="/test">Click me</LinkButton>);
      const link = screen.getByRole("link", { name: /click me/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });
  });

  describe("Variants", () => {
    it("should render primary variant by default", () => {
      render(<LinkButton href="/test">Primary</LinkButton>);
      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-jersey", "text-cream");
    });

    it("should render secondary variant", () => {
      render(
        <LinkButton href="/test" variant="secondary">
          Secondary
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-kcvv-gray");
    });

    it("should render ghost variant", () => {
      render(
        <LinkButton href="/test" variant="ghost">
          Ghost
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("border-2", "border-kcvv-green-bright");
    });

    it("should render link variant", () => {
      render(
        <LinkButton href="/test" variant="link">
          Link
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-kcvv-green-bright", "underline-offset-4");
    });
  });

  describe("Sizes", () => {
    it("should render medium size by default", () => {
      render(<LinkButton href="/test">Medium</LinkButton>);
      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-base", "px-8", "py-3");
    });

    it("should render small size", () => {
      render(
        <LinkButton href="/test" size="sm">
          Small
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-sm", "px-6", "py-2");
    });

    it("should render large size", () => {
      render(
        <LinkButton href="/test" size="lg">
          Large
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-lg", "px-10", "py-4");
    });
  });

  describe("Arrow Icon", () => {
    it("should not show arrow by default", () => {
      render(<LinkButton href="/test">No Arrow</LinkButton>);
      const link = screen.getByRole("link");
      expect(link.querySelector("svg")).not.toBeInTheDocument();
    });

    it("should show arrow when withArrow is true", () => {
      render(
        <LinkButton href="/test" withArrow>
          With Arrow
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      const icon = link.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Full Width", () => {
    it("should not be full width by default", () => {
      render(<LinkButton href="/test">Normal</LinkButton>);
      const link = screen.getByRole("link");
      expect(link).not.toHaveClass("w-full");
    });

    it("should be full width when fullWidth is true", () => {
      render(
        <LinkButton href="/test" fullWidth>
          Full
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("w-full");
    });
  });

  describe("Custom Props", () => {
    it("should accept custom className", () => {
      render(
        <LinkButton href="/test" className="custom-class">
          Custom
        </LinkButton>,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("custom-class");
    });

    it("should forward ref", () => {
      const ref = { current: null };
      render(
        <LinkButton href="/test" ref={ref}>
          Ref Link
        </LinkButton>,
      );
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe("Combination Props", () => {
    it("should combine variant, size, and arrow", () => {
      render(
        <LinkButton href="/test" variant="secondary" size="lg" withArrow>
          Combined
        </LinkButton>,
      );

      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-kcvv-gray");
      expect(link).toHaveClass("text-lg");
      expect(link.querySelector("svg")).toBeInTheDocument();
    });
  });
});
