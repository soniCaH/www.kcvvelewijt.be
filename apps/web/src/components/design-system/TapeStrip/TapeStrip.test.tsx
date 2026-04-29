import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TapeStrip } from "./TapeStrip";

describe("TapeStrip", () => {
  it("renders with default jersey colour and lg length", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "jersey");
    expect(el).toHaveAttribute("data-length", "lg");
  });

  it("respects color and length (non-default values)", () => {
    // Use length="sm" — non-default — so the test catches a regression that
    // would silently fall back to the default lg.
    const { container } = render(<TapeStrip color="ink" length="sm" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "ink");
    expect(el).toHaveAttribute("data-length", "sm");
  });

  it("left position reads var(--tape-left,12%) via Tailwind arbitrary class", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("left-[var(--tape-left,12%)]");
  });

  it("rotation reads var(--tape-rotation,-5deg) so grid slots can auto-vary", () => {
    const { container } = render(<TapeStrip />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toContain("var(--tape-rotation, -5deg)");
    expect(el.style.transform).toContain("translateY(-50%)");
  });
});
