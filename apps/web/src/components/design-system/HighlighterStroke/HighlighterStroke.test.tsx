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

  // Multi-line wrap support (#1543) — the stroke must repeat per visual line
  // when the highlighted span wraps. The implementation uses
  // `box-decoration-break: clone`, which the browser uses to clone the
  // background per inline fragment. JSDOM doesn't render multi-line
  // layouts, so we assert the CSS property is emitted on the element's
  // style object (VR baselines own the visual proof). The component also
  // emits the `-webkit-box-decoration-break` prefix for older Safari;
  // JSDOM does not surface vendor-prefixed properties through its
  // CSSStyleDeclaration nor in the serialised style attribute, so the
  // prefix is verified by inspection rather than unit-tested.
  it("emits box-decoration-break: clone for multi-line wrap", () => {
    const { container } = render(<HighlighterStroke>x</HighlighterStroke>);
    const span = container.firstChild as HTMLSpanElement;
    expect(span.style.boxDecorationBreak).toBe("clone");
  });
});
