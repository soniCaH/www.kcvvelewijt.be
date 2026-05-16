import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StripedSeam } from "./StripedSeam";

describe("StripedSeam", () => {
  it("renders an SVG with horizontal direction by default", () => {
    const { container } = render(<StripedSeam />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute("data-direction", "horizontal");
    expect(svg).toHaveAttribute("data-color-pair", "ink-cream");
  });

  it("respects direction, height, and colorPair props", () => {
    const { container } = render(
      <StripedSeam direction="vertical" height="lg" colorPair="jersey-cream" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-direction", "vertical");
    expect(svg).toHaveAttribute("data-height", "lg");
    expect(svg).toHaveAttribute("data-color-pair", "jersey-cream");
  });

  it("supports the jersey-tonal-dark colorPair (R6.C clubshop)", () => {
    const { container } = render(<StripedSeam colorPair="jersey-tonal-dark" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-color-pair", "jersey-tonal-dark");
    // Inner pattern fills derive from jersey-deep-dark + jersey-deep
    // tokens — verify both end up in the rendered <pattern>.
    expect(container.innerHTML).toContain("var(--color-jersey-deep-dark)");
    expect(container.innerHTML).toContain("var(--color-jersey-deep)");
  });

  it("supports the cream-jersey-deep colorPair (R5.B youth top frame)", () => {
    // Cream + jersey-deep — paper-tape vocabulary laid across a dark
    // green section bg. Quieter than a green-tonal pair against the
    // YouthBackdrop photo.
    const { container } = render(<StripedSeam colorPair="cream-jersey-deep" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-color-pair", "cream-jersey-deep");
    expect(container.innerHTML).toContain('fill="var(--color-cream)"');
    expect(container.innerHTML).toContain('fill="var(--color-jersey-deep)"');
  });

  it("supports the xl height variant (28px — R5.B youth band)", () => {
    const { container } = render(<StripedSeam height="xl" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-height", "xl");
    expect(svg).toHaveAttribute("height", "28");
  });

  it("defaults to angle -45° (data-flip='false')", () => {
    const { container } = render(<StripedSeam />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-flip", "false");
    expect(container.innerHTML).toContain("rotate(-45)");
  });

  it("flip=true mirrors the diagonal to +45°", () => {
    const { container } = render(<StripedSeam flip />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-flip", "true");
    expect(container.innerHTML).toContain("rotate(45)");
  });
});
