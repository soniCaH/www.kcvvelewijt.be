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
});
