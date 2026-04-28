import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HighlighterStroke } from "./HighlighterStroke";

describe("HighlighterStroke", () => {
  it("renders children", () => {
    render(<HighlighterStroke>nieuws</HighlighterStroke>);
    expect(screen.getByText("nieuws")).toBeInTheDocument();
  });

  it("default variant is 'a'", () => {
    const { container } = render(<HighlighterStroke>x</HighlighterStroke>);
    expect(container.firstChild).toHaveAttribute("data-variant", "a");
  });

  it("variant prop selects different stroke", () => {
    const { container } = render(
      <HighlighterStroke variant="b">x</HighlighterStroke>,
    );
    expect(container.firstChild).toHaveAttribute("data-variant", "b");
  });
});
