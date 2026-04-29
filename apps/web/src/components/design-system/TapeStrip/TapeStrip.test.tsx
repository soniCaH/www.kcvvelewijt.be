import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TapeStrip } from "./TapeStrip";

describe("TapeStrip", () => {
  it("renders with default jersey colour and tl position", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "jersey");
    expect(el).toHaveAttribute("data-position", "tl");
  });

  it("respects color and length", () => {
    const { container } = render(<TapeStrip color="ink" length="lg" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "ink");
    expect(el).toHaveAttribute("data-length", "lg");
  });

  it("rotation reads var(--tape-rotation,-5deg) so grid slots can auto-vary", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toContain("var(--tape-rotation, -5deg)");
    expect(el.style.transform).toContain("translateY(-50%)");
  });
});
