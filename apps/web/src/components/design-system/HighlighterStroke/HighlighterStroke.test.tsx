import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HighlighterStroke } from "./HighlighterStroke";

describe("HighlighterStroke", () => {
  it("renders children", () => {
    render(<HighlighterStroke>nieuws</HighlighterStroke>);
    expect(screen.getByText("nieuws")).toBeInTheDocument();
  });

  it("default color is jersey", () => {
    const { container } = render(<HighlighterStroke>x</HighlighterStroke>);
    expect(container.firstChild).toHaveAttribute("data-color", "jersey");
  });

  it("respects color prop", () => {
    const { container } = render(
      <HighlighterStroke color="ink">x</HighlighterStroke>,
    );
    expect(container.firstChild).toHaveAttribute("data-color", "ink");
  });

  it("renders with the stroke marker attribute", () => {
    const { container } = render(<HighlighterStroke>x</HighlighterStroke>);
    expect(container.firstChild).toHaveAttribute(
      "data-highlighter-stroke",
      "true",
    );
  });
});
