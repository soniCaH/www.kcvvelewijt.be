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

  it("respects color, position, length", () => {
    const { container } = render(
      <TapeStrip color="ink" position="tr" length="lg" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-color", "ink");
    expect(el).toHaveAttribute("data-position", "tr");
    expect(el).toHaveAttribute("data-length", "lg");
  });

  it("tl position: rotation -5deg, translateY -50% (straddles top edge)", () => {
    const { container } = render(<TapeStrip position="tl" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toContain("rotate(-5deg)");
    expect(el.style.transform).toContain("translateY(-50%)");
  });

  it("tr position: rotation 5deg (mirror lean)", () => {
    const { container } = render(<TapeStrip position="tr" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.transform).toContain("rotate(5deg)");
    expect(el.style.transform).toContain("translateY(-50%)");
  });
});
