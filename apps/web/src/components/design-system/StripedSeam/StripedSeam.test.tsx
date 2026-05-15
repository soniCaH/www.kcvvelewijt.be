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

  it("supports the jersey-tonal colorPair (R6.C clubshop)", () => {
    const { container } = render(<StripedSeam colorPair="jersey-tonal" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-color-pair", "jersey-tonal");
    // Inner pattern fills derive from jersey-deep-dark + jersey-deep
    // tokens — verify both end up in the rendered <pattern>.
    expect(container.innerHTML).toContain("var(--color-jersey-deep-dark)");
    expect(container.innerHTML).toContain("var(--color-jersey-deep)");
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
